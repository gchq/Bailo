import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { putReleaseSchema } from '../../../../src/routes/v2/release/putRelease.js'
import { createFixture, testPut } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/release.js', () => ({
  updateRelease: vi.fn(() => ({ _id: 'test' })),
}))

describe('routes > release > putRelease', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(putReleaseSchema)
    const res = await testPut(`/api/v2/model/${fixture.params.modelId}/release/${fixture.params.semver}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(putReleaseSchema)
    const res = await testPut(`/api/v2/model/${fixture.params.modelId}/release/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateRelease).toBeCalled()
    expect(audit.onUpdateRelease.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
