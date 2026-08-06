import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postReviewSchema } from '../../../../src/routes/v3/review/postReview.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'
import { testReviewResponse } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockReviewService = vi.hoisted(() => {
  return {
    createReview: vi.fn(() => testReviewResponse),
  }
})
vi.mock('../../../../src/services/v3/review.js', () => mockReviewService)

describe('routes > review > postReview', () => {
  test('successfully create a lifecycle review', async () => {
    const fixture = createFixture(postReviewSchema)
    const res = await testPost(`/api/v3/review/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postReviewSchema)
    const res = await testPost(`/api/v3/review/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateReview).toHaveBeenCalled()
    expect(audit.onCreateReview.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
