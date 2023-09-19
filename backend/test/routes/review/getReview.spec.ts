import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'
import { testReleaseReview, testReleaseReviewWithResponses } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')

const mockReviewService = vi.hoisted(() => {
  return {
    findReviewsByActive: vi.fn(() => [testReleaseReviewWithResponses]),
  }
})
vi.mock('../../../src/services/v2/review.js', () => mockReviewService)

describe('routes > review > getReviews', () => {
  const endpoint = `/api/v2/reviews`

  test('returns only inactive review requests', async () => {
    const res = await testGet(`${endpoint}?active=false`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only active review requests', async () => {
    mockReviewService.findReviewsByActive.mockReturnValueOnce([testReleaseReview])
    const res = await testGet(`${endpoint}?active=true`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('rejects missing active parameter', async () => {
    const res = await testGet(`${endpoint}`)

    expect(mockReviewService.findReviewsByActive).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('rejects missing value for active parameter', async () => {
    const res = await testGet(`${endpoint}?active`)

    expect(mockReviewService.findReviewsByActive).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })
})
