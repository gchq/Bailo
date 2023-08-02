// Some bad parts
import '../../../src/utils/test/testUtils.js'

import { describe, expect, test, vi } from 'vitest'

import { getModelSchema } from '../../../src/routes/v2/model/getModel.js'
import { createFixture, testGet } from '../../../src/utils/v2/test/routes.js'

const mockValidate = vi.hoisted(() => {
  return {
    parse: vi.fn(() => ({})),
  }
})
vi.mock('../../../utils/v2/validate.js', () => mockValidate)

describe('routes > model > getModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/v2/model.js', () => ({
      getModelById: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(getModelSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}`)

    console.log(res.body)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('200 > ok > unit', async () => {
    vi.mock('../../../src/services/v2/model.js', () => ({
      getModelById: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(getModelSchema)
    mockValidate.parse.mockReturnValueOnce(fixture)

    const res = await testGet(`/api/v2/model/${fixture.params.modelId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
