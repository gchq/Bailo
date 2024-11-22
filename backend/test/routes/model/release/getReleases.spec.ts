import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getReleasesSchema } from '../../../../src/routes/v2/release/getReleases.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/release.js', () => ({
  getModelReleases: vi.fn(() => [{ _id: 'test' }]),
}))

describe('routes > release > getReleases', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getReleasesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/releases`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getReleasesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/releases`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewReleases).toBeCalled()
    expect(audit.onViewReleases.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
