import { describe, expect, test, vi } from 'vitest'

import { getReleaseSchema } from '../../../../src/routes/v2/release/getRelease.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

vi.mock('../../../../src/services/v2/release.js', () => ({
  getReleaseBySemver: vi.fn(() => ({ _id: 'test' })),
}))

describe('routes > release > getRelease', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getReleaseSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/releases/${fixture.params.semver}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
