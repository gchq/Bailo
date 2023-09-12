import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'
import { testReleaseReviewRequest, testReleaseReviewRequestWithReview } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')

const mockReviewService = vi.hoisted(() => {
  return {
    findReviewRequestsByActive: vi.fn(() => [testReleaseReviewRequestWithReview]),
  }
})
vi.mock('../../../src/services/v2/review.js', () => mockReviewService)

describe('routes > reviewRequest > getReviewRequests', () => {
  test('returns only inactive review requests', async () => {
    const res = await testGet(`/api/v2/reviewRequests?active=false`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only active review requests', async () => {
    mockReviewService.findReviewRequestsByActive.mockReturnValueOnce([testReleaseReviewRequest])
    const res = await testGet(`/api/v2/reviewRequests?active=true`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('rejects missing active parameter', async () => {
    const res = await testGet(`/api/v2/reviewRequests`)

    expect(mockReviewService.findReviewRequestsByActive).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('rejects missing value for active parameter', async () => {
    const res = await testGet(`/api/v2/reviewRequests?active`)

    expect(mockReviewService.findReviewRequestsByActive).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })
})
