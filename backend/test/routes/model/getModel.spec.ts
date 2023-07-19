// Some bad parts
import '../../../src/utils/test/testUtils.js'

import { describe, expect, test, vi } from 'vitest'

import { getModelSchema } from '../../../src/routes/v2/model/getModel.js'
import { createFixture, testGet } from '../../../src/utils/v2/test/routes.js'

describe('routes > model > getModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/v2/model.js', () => ({
      getModelById: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(getModelSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
