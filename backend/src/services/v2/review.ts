import authorisation from '../../connectors/v2/authorisation/index.js'
import { CollaboratorEntry, ModelDoc } from '../../models/v2/Model.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import ReviewRequest, { ReviewRequestInterface } from '../../models/v2/ReviewRequest.js'
import { UserDoc } from '../../models/v2/User.js'
import { BadReq } from '../../utils/v2/error.js'
import { sendEmail } from './smtp/smtp.js'

export async function findReviewRequestsByActive(user: UserDoc, active: boolean): Promise<ReviewRequestInterface[]> {
  const approvals = await ReviewRequest.aggregate()
    .match({ active })
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

  return approvals
}

export async function countReviewRequests(user: UserDoc): Promise<number> {
  return (await findReviewRequestsByActive(user, true)).length
}

export async function createReviewRequests(model: ModelDoc, release: ReleaseDoc) {
  const entitiesForRole = getEntitiesForRole(model.collaborators, 'msro')
  if (entitiesForRole.length == 0) {
    throw BadReq('No Review Requests have been created')
  }
  const reviewRequest = new ReviewRequest({
    model: model.id,
    semver: release.semver,
    kind: 'release',
    role: 'msro',
    entities: entitiesForRole,
  })
  reviewRequest.save()

  entitiesForRole.forEach((entity) => sendEmail(entity, reviewRequest, release))

}

function getEntitiesForRole(collaborators: Array<CollaboratorEntry>, role: string): string[] {
  const roleEntities: string[] = collaborators
    .filter((collaborator) => {
      collaborator.roles.includes(role)
    })
    .map((collaborator) => collaborator.entity)
  return roleEntities
}
