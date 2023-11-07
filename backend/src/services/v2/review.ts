import authentication from '../../connectors/v2/authentication/index.js'
import { ModelAction } from '../../connectors/v2/authorisation/Base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import { AccessRequestDoc } from '../../models/v2/AccessRequest.js'
import { CollaboratorEntry, ModelDoc, ModelInterface } from '../../models/v2/Model.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import Review, { ReviewInterface, ReviewResponse } from '../../models/v2/Review.js'
import { UserDoc } from '../../models/v2/User.js'
import { ReviewKind, ReviewKindKeys } from '../../types/v2/enums.js'
import { asyncFilter } from '../../utils/v2/array.js'
import { toEntity } from '../../utils/v2/entity.js'
import { BadReq, GenericError, NotFound } from '../../utils/v2/error.js'
import log from './log.js'
import { getModelById } from './model.js'
import { requestReviewForAccessRequest, requestReviewForRelease } from './smtp/smtp.js'

export async function findReviews(
  user: UserDoc,
  active: boolean,
  modelId?: string,
  semver?: string,
  accessRequestId?: string,
  kind?: string,
): Promise<(ReviewInterface & { model: ModelInterface })[]> {
  const reviews = await Review.aggregate()
    .match({
      responses: active ? { $size: 0 } : { $not: { $size: 0 } },
      ...(modelId ? { modelId } : {}),
      ...(semver ? { semver } : {}),
      ...(accessRequestId ? { accessRequestId } : {}),
      ...(kind ? { kind } : {}),
    })
    .sort({ createdAt: -1 })
    // Populate model entries
    .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
    // Populate model as value instead of array
    .unwind({ path: '$model' })
    .match(await findUserInCollaborators(user))

  return asyncFilter(reviews, (review) => authorisation.userModelAction(user, review.model, ModelAction.View))
}

export async function createReleaseReviews(model: ModelDoc, release: ReleaseDoc) {
  const roleEntities = getRoleEntites(['mtr', 'msro'], model.collaborators)

  const createReviews = roleEntities.map((roleInfo) => {
    const review = new Review({
      semver: release.semver,
      modelId: model.id,
      kind: ReviewKind.Release,
      role: roleInfo.role,
    })
    try {
      roleInfo.entites.forEach((entity) => requestReviewForRelease(entity, review, release))
    } catch (error) {
      log.warn('Error when sending notifications requesting review for release.', { error })
    }
    return review.save()
  })
  await Promise.all(createReviews)
}

export async function createAccessRequestReviews(model: ModelDoc, accessRequest: AccessRequestDoc) {
  const roleEntities = getRoleEntites(['msro'], model.collaborators)

  const createReviews = roleEntities.map((roleInfo) => {
    const review = new Review({
      accessRequestId: accessRequest.id,
      modelId: model.id,
      kind: ReviewKind.Access,
      role: roleInfo.role,
    })
    try {
      roleInfo.entites.forEach((entity) => requestReviewForAccessRequest(entity, review, accessRequest))
    } catch (error) {
      log.warn('Error when sending notifications requesting review for Access Request.', { error })
    }
    return review.save()
  })
  await Promise.all(createReviews)
}

export type ReviewResponseParams = Pick<ReviewResponse, 'decision' | 'comment'>
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
  return update
}

function getRoleEntites(roles: string[], collaborators: CollaboratorEntry[]) {
  return roles.map((role) => {
    const entites = collaborators
      .filter((collaborator) => collaborator.roles.includes(role))
      .map((collaborator) => collaborator.entity)
    if (entites.length === 0) {
      throw BadReq('Unable to create Review Request. Could not find any entities for the role.', { role })
    }
    return { role, entites }
  })
}

/**
 * Requires the model attribute.
 * Return the models where one of the user's entities is in the model's collaberators
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
