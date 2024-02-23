import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { testGet } from '../../testUtils/routes.js'
import { testReleaseReview, testReleaseReviewWithResponses } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

const reviews = [testReleaseReviewWithResponses]
const mockReviewService = vi.hoisted(() => {
  return {
    findReviews: vi.fn(() => reviews),
  }
})
vi.mock('../../../src/services/review.js', () => mockReviewService)

describe('routes > review > getReviews', () => {
  const endpoint = `/api/v2/reviews`

  test('audit > expected call', async () => {
    const res = await testGet(`${endpoint}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onSearchReviews).toBeCalled()
    expect(audit.onSearchReviews.mock.calls.at(0).at(1)).toMatchSnapshot()
  })

  test('returns reviews', async () => {
    mockReviewService.findReviews.mockReturnValueOnce([testReleaseReview])
    const res = await testGet(`${endpoint}`)

    expect(res.statusCode).toBe(200)
    expect(res.header['x-count']).toBe(reviews.length.toString())
    expect(res.body).matchSnapshot()
  })

  test('returns only reviews for the specified model', async () => {
    mockReviewService.findReviews.mockReturnValueOnce([testReleaseReview])
    const res = await testGet(`${endpoint}?modelId=${testReleaseReview.modelId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
    expect(mockReviewService.findReviews.mock.calls).matchSnapshot()
  })
})
