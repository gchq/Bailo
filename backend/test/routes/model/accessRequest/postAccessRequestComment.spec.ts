import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postAccessRequestCommentSchema } from '../../../../src/routes/v2/model/accessRequest/postAccessRequestComment.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/accessRequest.js', () => ({
  newAccessRequestComment: vi.fn(() => ({ message: 'test' })),
}))

describe('routes > release > postReleaseComment', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postAccessRequestCommentSchema)
    const res = await testPost(
      `/api/v2/model/${fixture.params.modelId}/access-request/${fixture.params.accessRequestId}/comment`,
      fixture,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postAccessRequestCommentSchema)
    const res = await testPost(
      `/api/v2/model/${fixture.params.modelId}/access-request/${fixture.params.accessRequestId}/comment`,
      fixture,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateResponse).toBeCalled()
    expect(audit.onCreateResponse.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
