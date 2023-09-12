import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')

const mockReviewService = vi.hoisted(() => {
  return {
    countApprovals: vi.fn(() => 7),
  }
})
vi.mock('../../../src/services/v2/review.js', () => mockReviewService)

describe('routes > reviewRequest > getReviewRequests', () => {
  test('returns approvals count', async () => {
    const res = await testGet(`/api/v2/reviewRequests/count`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
