import { describe, expect, test, vi } from 'vitest'

import { deleteReleaseSchema } from '../../../../src/routes/v2/release/deleteRelease.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

describe('routes > release > deleteRelease', () => {
  test('200 > ok', async () => {
    vi.mock('../../../../src/services/v2/release.js', () => ({
      deleteRelease: vi.fn(() => ({ message: 'Successfully removed release.' })),
    }))

    const fixture = createFixture(deleteReleaseSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/releases/${fixture.params.semver}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
