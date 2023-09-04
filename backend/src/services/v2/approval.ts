import { testReleaseInactiveApproval } from '../../../test/testUtils/testModels.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import Approval, { ApprovalInterface } from '../../models/v2/Approval.js'
import { UserDoc } from '../../models/v2/User.js'

export async function findApprovalsByActive(user: UserDoc, active: boolean): Promise<ApprovalInterface[]> {
  const approvals = await Approval.aggregate()
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

/**
 * Added for testing- remove?
 */
export async function addDefaultApprovals() {
  const approvalDoc = new Approval(testReleaseInactiveApproval)

  await approvalDoc.save()
}
