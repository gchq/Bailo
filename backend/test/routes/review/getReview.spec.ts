import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'
import { testReleaseReview, testReleaseReviewWithResponses } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')

const mockReviewService = vi.hoisted(() => {
  return {
    findReviews: vi.fn(() => [testReleaseReviewWithResponses]),
  }
})
vi.mock('../../../src/services/v2/review.js', () => mockReviewService)

describe('routes > review > getReviews', () => {
  const endpoint = `/api/v2/reviews`

  test('returns only inactive reviews', async () => {
    const res = await testGet(`${endpoint}?active=false`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only active reviews', async () => {
    mockReviewService.findReviews.mockReturnValueOnce([testReleaseReview])
    const res = await testGet(`${endpoint}?active=true`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('rejects missing active parameter', async () => {
    const res = await testGet(`${endpoint}`)

    expect(mockReviewService.findReviews).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('rejects missing value for active parameter', async () => {
    const res = await testGet(`${endpoint}?active`)

    expect(mockReviewService.findReviews).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('returns only active reviews for the specified model', async () => {
    mockReviewService.findReviews.mockReturnValueOnce([testReleaseReview])
    const res = await testGet(`${endpoint}?active=true&modelId=${testReleaseReview.modelId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
