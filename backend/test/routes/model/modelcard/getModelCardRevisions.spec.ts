import { describe, expect, test, vi } from 'vitest'

import { getModelCardRevisionsSchema } from '../../../../src/routes/v2/model/modelcard/getModelCardRevisions.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'
import { testModelCardRevision } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

const mockModelService = vi.hoisted(() => {
  return {
    getModelCardRevisions: vi.fn(() => [testModelCardRevision]),
  }
})
vi.mock('../../../../src/services/v2/model.js', () => mockModelService)

describe('routes > model > modelcard > getModelCardRevisions', () => {
  test('return all model card revisions', async () => {
    mockModelService.getModelCardRevisions.mockResolvedValueOnce([testModelCardRevision])
    const fixture = createFixture(getModelCardRevisionsSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/model-card-revisions`)
    expect(res.statusCode).toBe(200)
    expect(res.body.modelCardRevisions[0].modelId).toBe(testModelCardRevision.modelId)
  })

  test('cannot find unknown modelId', async () => {
    mockModelService.getModelCardRevisions.mockResolvedValueOnce([])
    const res = await testGet(`/api/v2/model/no-model/model-card-revisions`)

    expect(mockModelService.getModelCardRevisions).toBeCalled()
    expect(res.statusCode).toBe(200)
    expect(res.body.modelCardRevisions).toHaveLength(0)
  })
})
