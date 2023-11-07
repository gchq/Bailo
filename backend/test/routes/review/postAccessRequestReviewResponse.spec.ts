import { describe, expect, test, vi } from 'vitest'

import { postAccessRequestReviewResponseSchema } from '../../../src/routes/v2/review/postAccessRequestReviewResponse.js'
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

describe('routes > review > postAccessRequestReviewResponse', () => {
  const endpoint = `/api/v2/model`

  test('successfully respond to a review', async () => {
    const res = await testPost(
      `${endpoint}/model-id/access-Request/accessRequestId/review`,
      createFixture(postAccessRequestReviewResponseSchema),
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('missing review decision', async () => {
    const fixture = createFixture(postAccessRequestReviewResponseSchema) as any
    delete fixture.body.decision
    const res = await testPost(`${endpoint}/model-id/access-Request/accessRequestId/review`, fixture)

    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('successfully respond to a review without a comment', async () => {
    const fixture = createFixture(postAccessRequestReviewResponseSchema) as any
    delete fixture.body.comment
    const res = await testPost(`${endpoint}/model-id/access-Request/accessRequestId/review`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
