import { describe, expect, test, vi } from 'vitest'
import { findApprovalsByActive } from '../../src/services/v2/approval.js'

const approvalModel = vi.hoisted(() => {
  const model: any = {}

  model.aggregate = vi.fn(() => model)
  model.match = vi.fn(() => model)
  model.sort = vi.fn(() => model)
  model.lookup = vi.fn(() => model)
  model.append = vi.fn(() => model)

  return model
})
vi.mock('../../src/models/v2/Approval.js', () => ({
  default: approvalModel,
}))

describe('services > approval', () => {
  test('findApprovalsByActive > no filters', async () => {
    const user: any = { dn: 'test' }
    const result = findApprovalsByActive(user, true)

    expect(approvalModel.match.mock.calls.at(0)).toMatchSnapshot()
  }
}