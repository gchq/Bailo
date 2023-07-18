// Some bad parts
import '../../../utils/test/testUtils.js'

import { describe, expect, test, vi } from 'vitest'

import { createFixture, testGet } from '../../../utils/v2/test/routes.js'
import { getModelSchema } from './getModel.js'

describe('routes > model > getModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../services/v2/model.js', () => ({
      getModelById: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(getModelSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
