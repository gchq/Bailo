import { describe, expect, test, vi } from 'vitest'

import { countApprovals, findApprovalsByActive } from '../../src/services/v2/approval.js'

vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

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
  test('findApprovalsByActive > active', async () => {
    const user: any = { dn: 'test' }
    await findApprovalsByActive(user, true)

    expect(approvalModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(approvalModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findApprovalsByActive > not active', async () => {
    const user: any = { dn: 'test' }
    await findApprovalsByActive(user, false)

    expect(approvalModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(approvalModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('countApprovals > successful', async () => {
    const user: any = { dn: 'test' }
    await countApprovals(user)

    expect(approvalModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(approvalModel.match.mock.calls.at(1)).toMatchSnapshot()
  })
})
