import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { Decision } from '../../../src/models/Response.js'
import { postAccessRequestReviewResponseSchema } from '../../../src/routes/v2/review/postAccessRequestReviewResponse.js'
import { createFixture, testPost } from '../../testUtils/routes.js'
import { testReviewResponse } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

const mockResponseService = vi.hoisted(() => {
  return {
    respondToReview: vi.fn(() => testReviewResponse),
  }
})
vi.mock('../../../src/services/response.js', () => mockResponseService)

describe('routes > review > postAccessRequestReviewResponse', () => {
  const endpoint = `/api/v2/model`

  test('successfully respond to a review', async () => {
    const res = await testPost(
      `${endpoint}/model-id/access-Request/accessRequestId/review`,
      createFixture(postAccessRequestReviewResponseSchema),
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const res = await testPost(
      `${endpoint}/model-id/access-Request/accessRequestId/review`,
      createFixture(postAccessRequestReviewResponseSchema),
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateReviewResponse).toBeCalled()
    expect(audit.onCreateReviewResponse.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('missing review decision', async () => {
    const fixture = createFixture(postAccessRequestReviewResponseSchema) as any
    delete fixture.body.decision
    const res = await testPost(`${endpoint}/model-id/access-Request/accessRequestId/review`, fixture)

    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('successfully respond to a review without a comment', async () => {
    const fixture = createFixture(postAccessRequestReviewResponseSchema) as any
    fixture.body.comment = ''
    fixture.body.decision = Decision.Approve
    const res = await testPost(`${endpoint}/model-id/access-Request/accessRequestId/review`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
