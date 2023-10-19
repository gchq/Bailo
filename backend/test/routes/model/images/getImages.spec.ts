import { describe, expect, test, vi } from 'vitest'

import { getImagesSchema } from '../../../../src/routes/v2/model/images/getImages.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

vi.mock('../../../../src/services/v2/registry.js', () => ({
  listModelImages: vi.fn(() => [{ _id: 'test' }]),
}))

describe('routes > images > getImages', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getImagesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/images`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
