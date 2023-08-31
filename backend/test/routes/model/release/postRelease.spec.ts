import { describe, expect, test, vi } from 'vitest'

import { postReleaseSchema } from '../../../../src/routes/v2/release/postRelease.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

vi.mock('../../../../src/services/v2/release.js', () => ({
  createRelease: vi.fn(() => ({ _id: 'test' })),
}))

describe('routes > release > postRelease', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postReleaseSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/releases`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('400 > no name', async () => {
    const fixture = createFixture(postReleaseSchema) as any

    // This release does not include a name.
    delete fixture.body.name

    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/releases`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
