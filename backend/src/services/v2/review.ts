import authorisation from '../../connectors/v2/authorisation/index.js'
import { CollaboratorEntry, ModelDoc } from '../../models/v2/Model.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import Review, { ReviewInterface, ReviewResponse } from '../../models/v2/Review.js'
import { UserDoc } from '../../models/v2/User.js'
import { ReviewKind } from '../../types/v2/enums.js'
import { toEntity } from '../../utils/v2/entity.js'
import { BadReq, GenericError, NotFound } from '../../utils/v2/error.js'
import log from './log.js'
import { requestReviewForRelease } from './smtp/smtp.js'

export async function findReviews(user: UserDoc, active: boolean, modelId?: string): Promise<ReviewInterface[]> {
  const reviews = await Review.aggregate()
    .match({
      responses: active ? { $size: 0 } : { $not: { $size: 0 } },
      ...(modelId ? { modelId } : {}),
    })
    .sort({ createdAt: -1 })
    // Populate model entries
    .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
    // Populate model as value instead of array
    .unwind({ path: '$model' })
    .match(
      // Move this into one variable
      {
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
                        $in: ['$$item.entity', await authorisation.getEntities(user)],
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
      },
    )

  return reviews
}

export async function countReviews(user: UserDoc): Promise<number> {
  return (await findReviews(user, true)).length
}

export async function createReleaseReviews(model: ModelDoc, release: ReleaseDoc) {
  // This will be added to the schema(s)
  const reviewRoles = ['msro', 'mtr']

  const roleEntities = reviewRoles.map((role) => {
    const entites = getEntitiesForRole(model.collaborators, role)
    if (entites.length == 0) {
      throw BadReq('Unable to create Review Request. Could not find any entities for the role.', { role })
    }
    return { role, entites }
  })

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

export type ReviewResponseParams = Pick<ReviewResponse, 'decision' | 'comment'>
export async function respondToReview(
  user: UserDoc,
  modelId: string,
  semver: string,
  role: string,
  response: ReviewResponseParams,
): Promise<ReviewInterface> {
  const review = (
    await Review.aggregate()
      .match({
        modelId,
        semver,
        role,
      })
      .sort({ createdAt: -1 })
      // Populate model entries
      .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
      // Populate model as value instead of array
      .unwind({ path: '$model' })
      .match({
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
                        $in: ['$$item.entity', await authorisation.getEntities(user)],
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
      })
      .limit(1)
  ).at(0)
  if (!review) {
    throw NotFound(`Unable to find Review to respond to.`, { modelId, semver, role })
  }
  const update = await Review.findByIdAndUpdate(review._id, {
    $push: { responses: { user: toEntity('user', user.dn), ...response } },
  })
  if (!update) {
    throw GenericError(500, `Adding response to review was not successful`, { modelId, semver, role })
  }
  return update
}
function getEntitiesForRole(collaborators: Array<CollaboratorEntry>, role: string): string[] {
  const roleEntities: string[] = collaborators
    .filter((collaborator) => collaborator.roles.includes(role))
    .map((collaborator) => collaborator.entity)
  return roleEntities
}
