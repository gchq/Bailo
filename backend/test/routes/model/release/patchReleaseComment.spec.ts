import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { patchReleaseCommentSchema } from '../../../../src/routes/v2/release/patchReleaseComment.js'
import { createFixture, testPatch } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/release.js', () => ({
  updateReleaseComment: vi.fn(() => ({ message: 'test' })),
}))

describe('routes > release > patchReleaseComment', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(patchReleaseCommentSchema)
    const res = await testPatch(
      `/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}/comment/${fixture.params.commentId}`,
      fixture,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(patchReleaseCommentSchema)
    const res = await testPatch(
      `/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}/comment/${fixture.params.commentId}`,
      fixture,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateRelease).toBeCalled()
    expect(audit.onUpdateRelease.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
