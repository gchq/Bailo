import { describe, expect, test, vi } from 'vitest'

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
})
