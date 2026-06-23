import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postNotifyReviewerSchema } from '../../../../src/routes/v3/review/postNotifyReviewer.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockReviewService = vi.hoisted(() => {
  return {
    notifyReviewer: vi.fn(() => {}),
  }
})
vi.mock('../../../../src/services/v3/review.js', () => mockReviewService)

describe('routes > review > notify reviewers of additional review', () => {
  test('successfully sends notification to reviewers', async () => {
    const fixture = createFixture(postNotifyReviewerSchema)
    const res = await testPost(`/api/v3/review/${fixture.params.reviewId}/notify`, {})

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const res = await testPost(`/api/v3/review/6a2c212c81e52c790216edb7/notify`, {})

    expect(res.statusCode).toBe(200)
    expect(audit.onNotifyReviewers).toHaveBeenCalled()
    expect(audit.onNotifyReviewers.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('returns 429 response when requested twice with same reviewId', async () => {
    const firstCall = await testPost(`/api/v3/review/6a2c212c81e52c790216edb8/notify`, {})
    expect(firstCall.statusCode).toBe(200)
    const secondCall = await testPost(`/api/v3/review/6a2c212c81e52c790216edb8/notify`, {})
    expect(secondCall.statusCode).toBe(429)
  })
})
