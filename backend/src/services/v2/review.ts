import authorisation from '../../connectors/v2/authorisation/index.js'
import { ModelDoc } from '../../models/v2/Model.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import ReviewRequest, { ReviewRequestInterface } from '../../models/v2/ReviewRequest.js'
import { UserDoc } from '../../models/v2/User.js'
import { BadReq } from '../../utils/v2/error.js'
import { sendEmail } from './smtp.js'

export async function findApprovalsByActive(user: UserDoc, active: boolean): Promise<ReviewRequestInterface[]> {
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

export async function countApprovals(user: UserDoc): Promise<number> {
  return (await findApprovalsByActive(user, true)).length
}

export async function createReviewRequests(model: ModelDoc, release: ReleaseDoc) {
  let requestCreated = false

  model.collaborators.forEach(async (collaborator) => {
    if (!collaborator.roles.includes('msro')) {
      return
    }

    // Create Approval Request
    const approval = new ReviewRequest({
      model: model.id,
      semver: release.semver,
      kind: 'release',
      entity: collaborator,
    })

    // Send email (async)
    sendEmail(collaborator.entity, approval, release)
    requestCreated = true
  })

  // I think we care?
  if (!requestCreated) {
    throw BadReq('No approval requests have been created')
  }
}
