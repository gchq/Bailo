import { describe, expect, test, vi } from 'vitest'

import { postReleaseReviewResponseSchema } from '../../../src/routes/v2/review/postReleaseReviewResponse.js'
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

describe('routes > review > postReleaseReviewResponse', () => {
  const endpoint = `/api/v2/model`

  test('successfully respond to a review', async () => {
    const res = await testPost(
      `${endpoint}/model-id/releases/1.1.1/review`,
      createFixture(postReleaseReviewResponseSchema),
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('missing review decision', async () => {
    const fixture = createFixture(postReleaseReviewResponseSchema) as any
    delete fixture.body.decision
    const res = await testPost(`${endpoint}/model-id/releases/1.1.1/review`, fixture)

    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('successfully respond to a review without a comment', async () => {
    const fixture = createFixture(postReleaseReviewResponseSchema) as any
    delete fixture.body.comment
    const res = await testPost(`${endpoint}/model-id/releases/1.1.1/review`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
