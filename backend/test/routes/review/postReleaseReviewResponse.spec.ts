import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { postReleaseReviewResponseSchema } from '../../../src/routes/v2/review/postReleaseReviewResponse.js'
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

describe('routes > review > postReleaseReviewResponse', () => {
  const endpoint = `/api/v2/model`

  test('successfully respond to a review', async () => {
    const res = await testPost(
      `${endpoint}/model-id/release/1.1.1/review`,
      createFixture(postReleaseReviewResponseSchema),
    )

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const res = await testPost(
      `${endpoint}/model-id/release/1.1.1/review`,
      createFixture(postReleaseReviewResponseSchema),
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateReviewResponse).toBeCalled()
    expect(audit.onCreateReviewResponse.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })

  test('missing review decision', async () => {
    const fixture = createFixture(postReleaseReviewResponseSchema) as any
    delete fixture.body.decision
    const res = await testPost(`${endpoint}/model-id/release/1.1.1/review`, fixture)

    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('successfully respond to a review without a comment', async () => {
    const fixture = createFixture(postReleaseReviewResponseSchema) as any
    delete fixture.body.comment
    const res = await testPost(`${endpoint}/model-id/release/1.1.1/review`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
