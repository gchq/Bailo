import { describe, expect, test, vi } from 'vitest'

import { countReviews, findReviewsByActive } from '../../src/services/v2/review.js'

vi.mock('../../src/connectors/v2/authorisation/index.js', async () => ({
  default: { getEntities: vi.fn(() => ['user:test']) },
}))

const ReviewModel = vi.hoisted(() => {
  const model: any = {}

  model.aggregate = vi.fn(() => model)
  model.match = vi.fn(() => model)
  model.sort = vi.fn(() => model)
  model.lookup = vi.fn(() => model)
  model.unwind = vi.fn(() => model)

  return model
})
vi.mock('../../src/models/v2/Review.js', async () => ({
  ...((await vi.importActual('../../src/models/v2/Review.js')) as object),
  default: ReviewModel,
}))

describe('services > review', () => {
  test('findReviewsByActive > active', async () => {
    const user: any = { dn: 'test' }
    await findReviewsByActive(user, true)

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('findReviewsByActive > not active', async () => {
    const user: any = { dn: 'test' }
    await findReviewsByActive(user, false)

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
  })

  test('countReviews > successful', async () => {
    const user: any = { dn: 'test' }
    await countReviews(user)

    expect(ReviewModel.match.mock.calls.at(0)).toMatchSnapshot()
    expect(ReviewModel.match.mock.calls.at(1)).toMatchSnapshot()
  })
})
