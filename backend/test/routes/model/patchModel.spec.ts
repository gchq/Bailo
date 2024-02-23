import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { patchModelSchema } from '../../../src/routes/v2/model/patchModel.js'
import { createFixture, testPatch } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/v2/config.js')
vi.mock('../../../src/connectors/audit/index.js')

describe('routes > model > patchModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/v2/model.js', () => ({
      updateModel: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(patchModelSchema)
    const res = await testPatch(`/api/v2/model/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../src/services/v2/model.js', () => ({
      updateModel: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(patchModelSchema)
    const res = await testPatch(`/api/v2/model/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateModel).toBeCalled()
    expect(audit.onUpdateModel.mock.calls.at(0).at(1)).toMatchSnapshot()
  })

  test('400 > bad visibility', async () => {
    const fixture = createFixture(patchModelSchema) as any

    fixture.body.visibility = 'not_valid'

    const res = await testPatch(`/api/v2/model/${fixture.params.modelId}`, fixture)

    expect(res.statusCode).toEqual(400)
    expect(res.body).matchSnapshot()
  })
})
