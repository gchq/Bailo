import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postCommentSchema } from '../../../../src/routes/v3/response/postComment.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'
import { testResponse } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/connectors/audit/index.js')

const mockResponseServices = vi.hoisted(() => {
  return {
    newComment: vi.fn(() => testResponse),
  }
})
vi.mock('../../../../src/services/v3/response.js', () => mockResponseServices)

describe('routes > response > postComment', () => {
  test('successfully submits a comment', async () => {
    const fixture = createFixture(postCommentSchema)
    const res = await testPost(`/api/v3/response/comment?${qs.stringify(fixture.query)}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body.response.message).toBe('test comment')
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postCommentSchema)
    const res = await testPost(`/api/v3/response/comment?${qs.stringify(fixture.query)}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateCommentResponse).toHaveBeenCalled()
    expect(audit.onCreateCommentResponse.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
