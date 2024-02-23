import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { getModelsSearchSchema } from '../../../src/routes/v2/model/getModelsSearch.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/v2/config.js')
vi.mock('../../../src/connectors/audit/index.js')

vi.mock('../../../src/services/v2/model.js', () => ({
  searchModels: vi.fn(() => [{ id: 'test', name: 'name', description: 'description', tags: ['tag'] }]),
}))

describe('routes > model > getModelsSearch', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getModelsSearchSchema)
    const res = await testGet(`/api/v2/models/search?${qs.stringify(fixture)}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getModelsSearchSchema)
    const res = await testGet(`/api/v2/models/search?${qs.stringify(fixture)}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onSearchModel).toBeCalled()
    expect(audit.onSearchModel.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
