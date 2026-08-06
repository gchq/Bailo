import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { Decision } from '../../../../src/models/Response.js'
import { postReviewResponseSchema } from '../../../../src/routes/v3/review/postReviewResponse.js'
import { ReviewKind } from '../../../../src/types/enums.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'
import { testReviewResponse } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockResponseService = vi.hoisted(() => ({
  respondToReview: vi.fn(() => testReviewResponse),
}))
vi.mock('../../../../src/services/v3/response.js', () => mockResponseService)

describe('routes > review > postReviewResponse', () => {
  const lifecycleReviewBody = {
    role: 'owner',
    decision: Decision.Approve,
    kind: ReviewKind.Lifecycle,
    modelId: 'model-123',
    dueDate: new Date('01/01/2051'),
  } as any

  const releaseReviewBody = {
    role: 'mtr',
    kind: ReviewKind.Release,
    modelId: 'model-123',
    semver: '1.1.1',
  } as any

  test('successfully respond to a review', async () => {
    const fixture = createFixture(postReviewResponseSchema)
    fixture.body = lifecycleReviewBody
    const res = await testPost(`/api/v3/review/test-123/response`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postReviewResponseSchema)
    fixture.body = lifecycleReviewBody
    const res = await testPost(`/api/v3/review/test-123/response`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateReviewResponse).toHaveBeenCalled()
    expect(audit.onCreateReviewResponse.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('missing review decision', async () => {
    const fixture = createFixture(postReviewResponseSchema)
    fixture.body = releaseReviewBody
    const res = await testPost(`/api/v3/review/test-123/response`, fixture)

    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('successfully respond to a review without a comment', async () => {
    const fixture = createFixture(postReviewResponseSchema)
    fixture.body = lifecycleReviewBody
    const res = await testPost(`/api/v3/review/test-123/response`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
