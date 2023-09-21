import { describe, expect, test, vi } from 'vitest'

import { postReviewResponseSchema } from '../../../src/routes/v2/review/postReviewResponse.js'
import { createFixture, testPost } from '../../testUtils/routes.js'
import { testReleaseReviewWithResponses } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/v2/config.js')
vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')

const mockReviewService = vi.hoisted(() => {
  return {
    respondToReview: vi.fn(() => testReleaseReviewWithResponses),
  }
})
vi.mock('../../../src/services/v2/review.js', () => mockReviewService)

describe('routes > review > getReviews', () => {
  const endpoint = `/api/v2/reviews`

  test('successfully respond to a review', async () => {
    const res = await testPost(`${endpoint}/model-id/1.1.1/msro`, createFixture(postReviewResponseSchema))

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('missing review decision', async () => {
    const fixture = createFixture(postReviewResponseSchema) as any
    delete fixture.body.decision
    const res = await testPost(`${endpoint}/model-id/1.1.1/msro`, fixture)

    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('successfully respond to a review without a comment', async () => {
    const fixture = createFixture(postReviewResponseSchema) as any
    delete fixture.body.comment
    const res = await testPost(`${endpoint}/model-id/1.1.1/msro`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
