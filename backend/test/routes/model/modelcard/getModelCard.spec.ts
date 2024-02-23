import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getModelCardSchema } from '../../../../src/routes/v2/model/modelcard/getModelCard.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/connectors/audit/index.js')

const modelMock = vi.hoisted(() => {
  return {
    getModelCard: vi.fn(() => undefined as any),
  }
})
vi.mock('../../../../src/services/v2/model.js', () => modelMock)

describe('routes > model > getModel', () => {
  test('latest > 200 > ok', async () => {
    modelMock.getModelCard.mockResolvedValueOnce({ example: 'test' })

    const fixture = createFixture(getModelCardSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/model-card/latest`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    modelMock.getModelCard.mockResolvedValueOnce({ example: 'test' })

    const fixture = createFixture(getModelCardSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/model-card/latest`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewModelCard).toBeCalled()
    expect(audit.onViewModelCard.mock.calls.at(0).at(1)).toMatchSnapshot()
    expect(audit.onViewModelCard.mock.calls.at(0).at(2)).toMatchSnapshot()
  })

  test('version > 200 > ok', async () => {
    modelMock.getModelCard.mockResolvedValueOnce({ _id: 'test' })

    const fixture = createFixture(getModelCardSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/model-card/100`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })
})
