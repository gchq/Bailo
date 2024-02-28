import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { postReleaseSchema } from '../../../../src/routes/v2/release/postRelease.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/release.js', () => ({
  createRelease: vi.fn(() => ({ _id: 'test' })),
}))

describe('routes > release > postRelease', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postReleaseSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/releases`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postReleaseSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/releases`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateRelease).toBeCalled()
    expect(audit.onCreateRelease.mock.calls.at(0).at(1)).toMatchSnapshot()
  })

  test('400 > no semver', async () => {
    const fixture = createFixture(postReleaseSchema) as any

    // This release does not include a semver.
    delete fixture.body.semver

    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/releases`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
