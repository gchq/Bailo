import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postReleaseCommentSchema } from '../../../../src/routes/v2/release/postReleaseComment.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/release.js', () => ({
  newReleaseComment: vi.fn(() => ({ message: 'test' })),
}))

describe('routes > release > postReleaseComment', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postReleaseCommentSchema)
    const res = await testPost(
      `/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}/comment`,
      fixture,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postReleaseCommentSchema)
    const res = await testPost(
      `/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}/comment`,
      fixture,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateCommentResponse).toBeCalled()
    expect(audit.onCreateCommentResponse.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
