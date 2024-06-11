import authentication from '../connectors/authentication/index.js'
import { ModelAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { AccessRequestDoc } from '../models/AccessRequest.js'
import { CollaboratorEntry, ModelDoc, ModelInterface } from '../models/Model.js'
import { ReleaseDoc } from '../models/Release.js'
import ResponseModel, { Decision, ResponseInterface, ResponseKind } from '../models/Response.js'
import Review, { ReviewDoc, ReviewInterface } from '../models/Review.js'
import { UserInterface } from '../models/User.js'
import { WebhookEvent } from '../models/Webhook.js'
import { ReviewKind, ReviewKindKeys } from '../types/enums.js'
import { toEntity } from '../utils/entity.js'
import { BadReq, GenericError, NotFound } from '../utils/error.js'
import { getAccessRequestById } from './accessRequest.js'
import log from './log.js'
import { getModelById } from './model.js'
import { getReleaseBySemver } from './release.js'
import {
  notifyReviewResponseForAccess,
  notifyReviewResponseForRelease,
  requestReviewForAccessRequest,
  requestReviewForRelease,
} from './smtp/smtp.js'
import { sendWebhooks } from './webhook.js'

// This should be replaced by using the dynamic schema
const requiredRoles = {
  release: ['mtr', 'msro'],
  accessRequest: ['msro'],
}

export async function findReviews(
  user: UserInterface,
  mine: boolean,
  modelId?: string,
  semver?: string,
  accessRequestId?: string,
  kind?: string,
): Promise<(ReviewInterface & { model: ModelInterface })[]> {
  const reviews = await Review.aggregate()
    .match({
      ...(modelId && { modelId }),
      ...(semver && { semver }),
      ...(accessRequestId && { accessRequestId }),
      ...(kind && { kind }),
    })
    .sort({ createdAt: -1 })
    // Populate model entries
    .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
    // Populate model as value instead of array
    .unwind({ path: '$model' })
    .lookup({ from: 'v2_responses', localField: 'responseIds', foreignField: '_id', as: 'responses' })
    .match({ ...(mine && (await findUserInCollaborators(user))) })

  const auths = await authorisation.models(
    user,
    reviews.map((review) => review.model),
    ModelAction.View,
  )

  return reviews.filter((_, i) => auths[i].success)
}

export async function createReleaseReviews(model: ModelDoc, release: ReleaseDoc) {
  const roleEntities = getRoleEntities(requiredRoles.release, model.collaborators)

  const createReviews = roleEntities.map((roleInfo) => {
    const review = new Review({
      semver: release.semver,
      modelId: model.id,
      kind: ReviewKind.Release,
      role: roleInfo.role,
    })
    roleInfo.entities.forEach((entity) =>
      requestReviewForRelease(entity, review, release).catch((error) =>
        log.warn({ error }, 'Error when sending notifications requesting review for release.'),
      ),
    )
    return review.save()
  })
  await Promise.all(createReviews)
}

export async function createAccessRequestReviews(model: ModelDoc, accessRequest: AccessRequestDoc) {
  const roleEntities = getRoleEntities(requiredRoles.accessRequest, model.collaborators)

  const createReviews = roleEntities.map((roleInfo) => {
    const review = new Review({
      accessRequestId: accessRequest.id,
      modelId: model.id,
      kind: ReviewKind.Access,
      role: roleInfo.role,
    })
    roleInfo.entities.forEach((entity) =>
      requestReviewForAccessRequest(entity, review, accessRequest).catch((error) =>
        log.warn({ error }, 'Error when sending notifications requesting review for Access Request.'),
      ),
    )
    return review.save()
  })
  await Promise.all(createReviews)
}

export type ReviewResponseParams = Pick<ResponseInterface, 'comment' | 'decision'>

export async function respondToReview(
  user: UserInterface,
  modelId: string,
  role: string,
  response: ReviewResponseParams,
  kind: ReviewKindKeys,
  reviewId: string,
): Promise<ReviewInterface> {
  let reviewIdQuery
  switch (kind) {
    case ReviewKind.Access:
      reviewIdQuery = { accessRequestId: reviewId }
      break
    case ReviewKind.Release:
      reviewIdQuery = { semver: reviewId }
      break
    default:
      throw BadReq('Review Kind not recognised', reviewIdQuery)
  }

  // Authorisation check to make sure the user can access a model
  await getModelById(user, modelId)

  const review = (
    await Review.aggregate()
      .match({
        modelId,
        ...reviewIdQuery,
        role,
      })
      .sort({ createdAt: -1 })
      // Populate model entries
      .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
      // Populate model as value instead of array
      .unwind({ path: '$model' })
      .match(await findUserInCollaborators(user))
      .limit(1)
  ).at(0)
  if (!review) {
    throw NotFound(`Unable to find Review to respond to.`, { modelId, reviewIdQuery, role })
  }

  // Store the response
  const reviewResponse = new ResponseModel({
    entity: toEntity('user', user.dn),
    kind: ResponseKind.Review,
    role,
    parentId: review._id,
    ...response,
  })

  await reviewResponse.save()
  await sendReviewResponseNotification(review, reviewResponse, user)

  sendWebhooks(
    review.modelId,
    WebhookEvent.CreateReviewResponse,
    `A new response has been added to a review requested for Model ${review.modelId}`,
    { review: review },
  )

  return review
}

export async function sendReviewResponseNotification(
  review: ReviewDoc,
  reviewResponse: ResponseInterface,
  user: UserInterface,
) {
  let reviewIdQuery
  switch (review.kind) {
    case ReviewKind.Access: {
      if (!review.accessRequestId) {
        log.error({ review }, 'Unable to send notification for review response. Cannot find access request ID.')
        return
      }

      const access = await getAccessRequestById(user, review.accessRequestId)
      notifyReviewResponseForAccess(reviewResponse, access).catch((error) =>
        log.warn({ error }, 'Error when notifying collaborators about review response.'),
      )
      break
    }
    case ReviewKind.Release: {
      if (!review.semver) {
        log.error({ review }, 'Unable to send notification for review response. Cannot find semver.')
        return
      }

      const release = await getReleaseBySemver(user, review.modelId, review.semver)
      notifyReviewResponseForRelease(reviewResponse, release).catch((error) =>
        log.warn({ error }, 'Error when notifying collaborators about review response.'),
      )
      break
    }
    default:
      throw GenericError(500, 'Review Kind not recognised', reviewIdQuery)
  }
}

//TODO This won't work for response refactor
export async function checkAccessRequestsApproved(accessRequestIds: string[]) {
  const reviews = await Review.find({
    accessRequestId: accessRequestIds,
    responses: {
      $elemMatch: {
        decision: Decision.Approve,
      },
    },
  })
  return reviews.some((review) => requiredRoles.accessRequest.includes(review.role))
}

function getRoleEntities(roles: string[], collaborators: CollaboratorEntry[]) {
  return roles.map((role) => {
    const entities = collaborators
      .filter((collaborator) => collaborator.roles.includes(role))
      .map((collaborator) => collaborator.entity)
    return { role, entities }
  })
}

/**
 * Requires the model attribute.
 * Return the models where one of the user's entities is in the model's collaborators
 * and the role in the review is in the list of roles in that collaborator entry.
 */
async function findUserInCollaborators(user: UserInterface) {
  return {
    $expr: {
      $gt: [
        {
          $size: {
            $filter: {
              input: '$model.collaborators',
              as: 'item',
              cond: {
                $and: [
                  {
                    $in: ['$$item.entity', await authentication.getEntities(user)],
                  },
                  {
                    $in: ['$role', '$$item.roles'],
                  },
                ],
              },
            },
          },
        },
        0,
      ],
    },
  }
}
