import { describe, expect, test, vi } from 'vitest'

import { getReleasesSchema } from '../../../../src/routes/v2/release/getReleases.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

vi.mock('../../../../src/services/v2/release.js', () => ({
  getModelReleases: vi.fn(() => [{ _id: 'test' }]),
}))

describe('routes > release > getReleases', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getReleasesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/releases`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
