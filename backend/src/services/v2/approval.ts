import Approval, { ApprovalInterface } from '../../models/v2/Approval.js'

export async function findApprovalsByActive(active: boolean): Promise<ApprovalInterface[]> {
  const baseSchemas = await Approval.find({ ...(active && { active }) }).sort({ createdAt: -1 })
  return baseSchemas
}