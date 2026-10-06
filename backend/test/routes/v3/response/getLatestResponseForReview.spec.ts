import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getLatestResponseSchema } from '../../../../src/routes/v3/response/getLatestResponseForReview.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'
import { testResponse } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockResponseServices = vi.hoisted(() => {
  return {
    getLatestResponseForReview: vi.fn(() => testResponse),
  }
})
vi.mock('../../../../src/services/v3/response.js', () => mockResponseServices)

describe('routes > response > getLatestReviewResponse', () => {
  test('successfully fetches the latest response for a review', async () => {
    const fixture = createFixture(getLatestResponseSchema)
    const res = await testGet(`/api/v3/review/${fixture.params.reviewId}/responses/latest`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getLatestResponseSchema)
    const res = await testGet(`/api/v3/review/${fixture.params.reviewId}/responses/latest`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewResponses).toHaveBeenCalled()
    expect(audit.onViewResponses.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
