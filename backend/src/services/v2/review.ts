import authentication from '../../connectors/v2/authentication/index.js'
import { ModelAction } from '../../connectors/v2/authorisation/base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import { AccessRequestDoc } from '../../models/v2/AccessRequest.js'
import { CollaboratorEntry, ModelDoc, ModelInterface } from '../../models/v2/Model.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import Review, { Decision, ReviewDoc, ReviewInterface, ReviewResponse } from '../../models/v2/Review.js'
import { UserDoc } from '../../models/v2/User.js'
import { WebhookEvent } from '../../models/v2/Webhook.js'
import { ReviewKind, ReviewKindKeys } from '../../types/v2/enums.js'
import { toEntity } from '../../utils/v2/entity.js'
import { BadReq, GenericError, NotFound } from '../../utils/v2/error.js'
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

export async function findReviews(
  user: UserDoc,
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
    .match(await findUserInCollaborators(user))

  const auths = await authorisation.models(
    user,
    reviews.map((review) => review.model),
    ModelAction.View,
  )

  return reviews.filter((_, i) => auths[i].success)
}

export async function createReleaseReviews(model: ModelDoc, release: ReleaseDoc) {
  const roleEntities = getRoleEntities(['mtr', 'msro'], model.collaborators)

  const createReviews = roleEntities.map((roleInfo) => {
    const review = new Review({
      semver: release.semver,
      modelId: model.id,
      kind: ReviewKind.Release,
      role: roleInfo.role,
    })
    roleInfo.entities.forEach((entity) =>
      requestReviewForRelease(entity, review, release).catch((error) =>
        log.warn('Error when sending notifications requesting review for release.', { error }),
      ),
    )
    return review.save()
  })
  await Promise.all(createReviews)
}

export async function createAccessRequestReviews(model: ModelDoc, accessRequest: AccessRequestDoc) {
  const roleEntities = getRoleEntities(['msro'], model.collaborators)

  const createReviews = roleEntities.map((roleInfo) => {
    const review = new Review({
      accessRequestId: accessRequest.id,
      modelId: model.id,
      kind: ReviewKind.Access,
      role: roleInfo.role,
    })
    roleInfo.entities.forEach((entity) =>
      requestReviewForAccessRequest(entity, review, accessRequest).catch((error) =>
        log.warn('Error when sending notifications requesting review for Access Request.', { error }),
      ),
    )
    return review.save()
  })
  await Promise.all(createReviews)
}

export type ReviewResponseParams = Pick<ReviewResponse, 'comment' | 'decision'>
export async function respondToReview(
  user: UserDoc,
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
  const update = await Review.findByIdAndUpdate(
    review._id,
    {
      $push: { responses: { user: toEntity('user', user.dn), ...response } },
    },
    { new: true },
  )
  if (!update) {
    throw GenericError(500, `Adding response to Review was not successful`, { modelId, reviewIdQuery, role })
  }
  await sendReviewResponseNotification(update, user)

  sendWebhooks(
    update.modelId,
    WebhookEvent.CreateReviewResponse,
    `A new response has been added to a review requested for Model ${update.modelId}`,
    { review: update },
  )

  return update
}

export async function sendReviewResponseNotification(review: ReviewDoc, user: UserDoc) {
  let reviewIdQuery
  switch (review.kind) {
    case ReviewKind.Access: {
      if (!review.accessRequestId) {
        log.error('Unable to send notification for review response. Cannot find access request ID.', { review })
        return
      }

      const access = await getAccessRequestById(user, review.accessRequestId)
      notifyReviewResponseForAccess(review, access).catch((error) =>
        log.warn(log.warn('Error when notifying collaborators about review response.', { error })),
      )
      break
    }
    case ReviewKind.Release: {
      if (!review.semver) {
        log.error('Unable to send notification for review response. Cannot find semver.', { review })
        return
      }

      const release = await getReleaseBySemver(user, review.modelId, review.semver)
      notifyReviewResponseForRelease(review, release).catch((error) =>
        log.warn(log.warn('Error when notifying collaborators about review response.', { error })),
      )
      break
    }
    default:
      throw GenericError(500, 'Review Kind not recognised', reviewIdQuery)
  }
}

export async function getApprovedAccessRequestReviews(accessRequestIds: string[]) {
  const reviews = await Review.find({
    accessRequestId: accessRequestIds,
    responses: {
      $elemMatch: {
        decision: Decision.Approve,
      },
    },
  })
  return reviews.some((review) => review.role === 'msro')
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
async function findUserInCollaborators(user: UserDoc) {
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
