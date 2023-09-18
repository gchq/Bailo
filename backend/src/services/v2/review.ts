import authorisation from '../../connectors/v2/authorisation/index.js'
import { CollaboratorEntry, ModelDoc } from '../../models/v2/Model.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import Review, { ReviewInterface } from '../../models/v2/Review.js'
import { UserDoc } from '../../models/v2/User.js'
import { BadReq } from '../../utils/v2/error.js'
import { requestReviewForRelease } from './smtp/smtp.js'
import log from './log.js'
import { ReviewKind } from '../../types/v2/enums.js'

export async function findReviewsByActive(user: UserDoc, active: boolean): Promise<ReviewInterface[]> {
  const reviews = await Review.aggregate()
    .match({ reviews: active ? { $size: 0 } : { $not: { $size: 0 } } })
    .sort({ createdAt: -1 })
    // Populate model entries
    .lookup({ from: 'v2_models', localField: 'model', foreignField: 'id', as: 'model' })
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

  return reviews
}

export async function countReviews(user: UserDoc): Promise<number> {
  return (await findReviewsByActive(user, true)).length
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

function getEntitiesForRole(collaborators: Array<CollaboratorEntry>, role: string): string[] {
  const roleEntities: string[] = collaborators
    .filter((collaborator) => collaborator.roles.includes(role))
    .map((collaborator) => collaborator.entity)
  return roleEntities
}
