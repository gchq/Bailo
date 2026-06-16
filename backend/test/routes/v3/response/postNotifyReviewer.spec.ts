import { describe, expect, test, vi } from 'vitest'

import { postNotifyReviewerSchema } from '../../../../src/routes/v3/response/postNotifyReviewer.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockResponseServices = vi.hoisted(() => {
  return {
    notifyReviewer: vi.fn(() => {}),
  }
})
vi.mock('../../../../src/services/v3/response.js', () => mockResponseServices)

describe('routes > response > getLatestReviewResponse', () => {
  test('successfully fetches the latest response for a review', async () => {
    const fixture = createFixture(postNotifyReviewerSchema)
    const res = await testPost(`/api/v3/response/${fixture.params.responseId}/reviewer/notify`, {})

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
