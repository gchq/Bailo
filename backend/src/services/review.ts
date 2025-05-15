import authentication from '../connectors/authentication/index.js'
import { ModelAction, ReviewRoleAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { AccessRequestDoc } from '../models/AccessRequest.js'
import { CollaboratorEntry, ModelDoc, ModelInterface } from '../models/Model.js'
import { ReleaseDoc } from '../models/Release.js'
import Review, { ReviewDoc, ReviewInterface } from '../models/Review.js'
import ReviewRoleModel, { ReviewRoleInterface } from '../models/ReviewRole.js'
import { UserInterface } from '../models/User.js'
import { ReviewKind, ReviewKindKeys } from '../types/enums.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../utils/error.js'
import { handleDuplicateKeys } from '../utils/mongo.js'
import log from './log.js'
import { getModelById } from './model.js'
import { requestReviewForAccessRequest, requestReviewForRelease } from './smtp/smtp.js'

// This should be replaced by using the dynamic schema
const requiredRoles = {
  release: ['mtr', 'msro'],
  accessRequest: ['msro'],
}

export const allReviewRoles = [...new Set(requiredRoles.release.concat(requiredRoles.accessRequest))]

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

export async function removeAccessRequestReviews(accessRequestId: string) {
  // finding and then calling potentially multiple deletes is inefficient but the mongoose-softdelete
  // plugin doesn't cover bulkDelete
  const accessRequestReviews = await findReviewsForAccessRequests([accessRequestId])

  const deletions: ReviewDoc[] = []
  for (const accessRequestReview of accessRequestReviews) {
    try {
      deletions.push(await accessRequestReview.delete())
    } catch (error) {
      throw InternalError('The requested access request review could not be deleted.', {
        accessRequestId,
        error,
      })
    }
  }

  return deletions
}

export async function findReviewForResponse(
  user: UserInterface,
  modelId: string,
  role: string,
  kind: ReviewKindKeys,
  reviewId: string,
): Promise<ReviewDoc> {
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

  const review: ReviewDoc = (
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

  return review
}

//TODO This won't work for response refactor
export async function findReviewsForAccessRequests(accessRequestIds: string[]) {
  const reviews: ReviewDoc[] = await Review.find({
    accessRequestId: accessRequestIds,
  })
  return reviews.filter((review) => requiredRoles.accessRequest.includes(review.role))
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

export async function createReviewRole(user: UserInterface, newReviewRole: ReviewRoleInterface) {
  const reviewRole = new ReviewRoleModel({
    ...newReviewRole,
  })

  const auth = await authorisation.reviewRole(user, reviewRole, ReviewRoleAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
    })
  }

  try {
    return await reviewRole.save()
  } catch (error) {
    handleDuplicateKeys(error)
    throw error
  }

  return reviewRole
}

export async function findReviewRoles(): Promise<ReviewRoleInterface[]> {
  const reviewRoles = await ReviewRoleModel.find()
  return reviewRoles
}
