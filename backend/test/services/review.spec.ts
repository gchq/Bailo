import { describe, expect, test, vi } from 'vitest'

import { countReviewRequests, findReviewRequestsByActive } from '../../src/services/v2/review.js'

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

describe('services > review', () => {
  test('findApprovalsByActive > active', async () => {
    const user: any = { dn: 'test' }
    await findReviewRequestsByActive(user, true)

    expect(ReviewRequestModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewRequestModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findReviewRequestsByActive > not active', async () => {
    const user: any = { dn: 'test' }
    await findReviewRequestsByActive(user, false)

    expect(ReviewRequestModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewRequestModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('countReviewRequests > successful', async () => {
    const user: any = { dn: 'test' }
    await countReviewRequests(user)

    expect(ReviewRequestModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewRequestModel.match.mock.calls.at(1)).toMatchSnapshot()
  })
})
