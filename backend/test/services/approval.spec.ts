import { describe, expect, test, vi } from 'vitest'

import { countApprovals, findApprovalsByActive } from '../../src/services/v2/review.js'

vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

const ReviewRequestModel = vi.hoisted(() => {
  const model: any = {}

  model.aggregate = vi.fn(() => model)
  model.match = vi.fn(() => model)
  model.sort = vi.fn(() => model)
  model.lookup = vi.fn(() => model)
  model.unwind = vi.fn(() => model)

  return model
})
vi.mock('../../src/models/v2/ReviewRequest.js', () => ({
  default: ReviewRequestModel,
}))

describe('services > approval', () => {
  test('findApprovalsByActive > active', async () => {
    const user: any = { dn: 'test' }
    await findApprovalsByActive(user, true)

    expect(ReviewRequestModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewRequestModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findApprovalsByActive > not active', async () => {
    const user: any = { dn: 'test' }
    await findApprovalsByActive(user, false)

    expect(ReviewRequestModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewRequestModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('countApprovals > successful', async () => {
    const user: any = { dn: 'test' }
    await countApprovals(user)

    expect(ReviewRequestModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewRequestModel.match.mock.calls.at(1)).toMatchSnapshot()
  })
})
