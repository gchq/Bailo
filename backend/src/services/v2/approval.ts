import { testReleaseApproval } from '../../../test/testUtils/testModels.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import Approval, { ApprovalInterface } from '../../models/v2/Approval.js'
import { UserDoc } from '../../models/v2/User.js'

export async function findApprovalsByActive(user: UserDoc, active: boolean): Promise<ApprovalInterface[]> {
  const approvals = await Approval.aggregate()
    .match({ ...(active && { active }) })
    .sort({ createdAt: -1 })
    // Populate model entries
    .lookup({ from: 'v2_models', localField: 'model', foreignField: 'id', as: 'model' })
    // Populate model as value instead of array
    .append({ $set: { model: { $arrayElemAt: ['$model', 0] } } })
    .match({
      'model.collaborators': {
        $elemMatch: {
          entity: { $in: await authorisation.getEntities(user) },
        },
      },
    })

  return approvals
}

export async function addDefaultApprovals() {
  const approvalDoc = new Approval(testReleaseApproval)

  const result = await approvalDoc.save()
  console.log(JSON.stringify(result))
}
