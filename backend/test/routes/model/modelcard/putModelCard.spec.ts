import { ObjectId } from 'mongodb'
import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import ModelCardRevisionModel from '../../../../src/models/ModelCardRevision.js'
import { putModelCardSchema } from '../../../../src/routes/v2/model/modelcard/putModelCard.js'
import { createFixture, testPut } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/authorisation/index.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')

const modelServiceMock = vi.hoisted(() => {
  return {
    updateModelCard: vi.fn(() => undefined as any),
  }
})
vi.mock('../../../../src/services/model.js', () => modelServiceMock)

describe('routes > model > putModelCard', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(putModelCardSchema)
    modelServiceMock.updateModelCard.mockResolvedValueOnce(
      new ModelCardRevisionModel({
        _id: new ObjectId('6776901b879d08e34b599d7e'),
        id: new ObjectId('6776901b879d08e34b599d7e'),
        modelId: 'test',
      }),
    )
    const res = await testPut(`/api/v2/model/${fixture.params.modelId}/model-cards`, fixture)
    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(putModelCardSchema)
    modelServiceMock.updateModelCard.mockResolvedValueOnce(
      new ModelCardRevisionModel({
        _id: new ObjectId('6776901b879d08e34b599d7e'),
        id: new ObjectId('6776901b879d08e34b599d7e'),
        modelId: 'test',
      }),
    )
    const res = await testPut(`/api/v2/model/${fixture.params.modelId}/model-cards`, fixture)
    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateModelCard).toBeCalled()
    expect(audit.onUpdateModelCard.mock.calls.at(0)?.at(1)).toMatchSnapshot()
    expect(audit.onUpdateModelCard.mock.calls.at(0)?.at(2)).toMatchSnapshot()
  })
})
