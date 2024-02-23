import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { putModelCardSchema } from '../../../../src/routes/v2/model/modelcard/putModelCard.js'
import { createFixture, testPut } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/authorisation/index.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/model.js', async () => {
  const actual = (await vi.importActual('../../../../src/services/model.js')) as object
  return {
    ...actual,
    updateModelCard: vi.fn(() => ({ _id: 'test' })),
  }
})

describe('routes > model > postModel', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(putModelCardSchema)
    const res = await testPut(`/api/v2/model/${fixture.params.modelId}/model-cards`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(putModelCardSchema)
    const res = await testPut(`/api/v2/model/${fixture.params.modelId}/model-cards`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateModelCard).toBeCalled()
    expect(audit.onUpdateModelCard.mock.calls.at(0).at(1)).toMatchSnapshot()
    expect(audit.onUpdateModelCard.mock.calls.at(0).at(2)).toMatchSnapshot()
  })
})
