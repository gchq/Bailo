import { testReleaseInactiveApproval } from '../../../test/testUtils/testModels.js'
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

export async function createApprovalRequests(model: ModelDoc, release: ReleaseDoc) {
  const msros = model.collaborators.filter((collaborator) => {
    collaborator.roles.includes('msro')
  })

  let requestCreated = false
  msros.forEach(async (collaborator) => {
    if (!collaborator.roles.includes('msro')) {
      return
    }

    // Create Approval Request
    // Duplicate approvals? In group as well as being a named user?
    const approval = new ReviewRequest({
      model: model.id,
      modelArtefact: release.semver,
      kind: 'release',
      role: "msro",
    })

    // Send email (async)
    sendEmail(
      (await authorisation.getUserInformation(collaborator.entity)).email,
      approval,
      release 
    )
    requestCreated = true
  })

  // I think we care?
  if(!requestCreated) {
    throw BadReq('No approval requests have been created')
  }
}

/**
 * Added for testing- remove?
 */
export async function addDefaultApprovals() {
  const approvalDoc = new ReviewRequest(testReleaseInactiveApproval)

  await approvalDoc.save()
}
