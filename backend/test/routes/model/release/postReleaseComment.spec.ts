import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/v2/audit/__mocks__/index.js'
import { postReleaseCommentSchema } from '../../../../src/routes/v2/release/postReleaseComment.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/v2/audit/index.js')
vi.mock('../../../../src/connectors/v2/authorisation/index.js')

vi.mock('../../../../src/services/v2/release.js', () => ({
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
    expect(audit.onUpdateRelease).toBeCalled()
    expect(audit.onUpdateRelease.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
