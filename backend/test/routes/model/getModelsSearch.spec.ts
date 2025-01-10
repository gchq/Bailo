import qs from 'qs'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { EntryKind } from '../../../src/models/Model.js'
import {
  GetModelsResponse,
  getModelsSearchSchema,
  ModelSearchResult,
} from '../../../src/routes/v2/model/getModelsSearch.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')

const mockedModelResult: ModelSearchResult = {
  id: 'test',
  name: 'name',
  description: 'description',
  tags: ['tag'],
  kind: EntryKind.Model,
}
const mockedResults: GetModelsResponse = {
  models: [mockedModelResult],
  totalEntries: 1,
}

vi.mock('../../../src/services/model.js', () => ({
  searchModels: vi.fn(() => mockedResults),
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
    expect(audit.onSearchModel.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
