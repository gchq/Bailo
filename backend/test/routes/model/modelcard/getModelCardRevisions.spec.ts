import { describe, expect, test, vi } from 'vitest'

import { getModelCardRevisionsSchema } from '../../../../src/routes/v2/model/modelcard/getModelCardRevisions.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'
import { testModelCardRevisions } from '../../../testUtils/testModels.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')

const mockModelCardRevision = vi.hoisted(() => {
  return {
    getModelCardRevisions: vi.fn(() => [testModelCardRevisions]),
  }
})
vi.mock('../../../../src/services/v2/model.js', () => mockModelCardRevision)

describe('routes > model > modelcard > getModelCardRevisions', () => {
  test('return all model card revisions', async () => {
    const fixture = createFixture(getModelCardRevisionsSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/model-card-revisions`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only model card versions with the modelId parameter', async () => {
    const fixture = createFixture(getModelCardRevisionsSchema)
    mockModelCardRevision.getModelCardRevisions.mockReturnValueOnce([testModelCardRevisions])
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('cannot find unknown modelId', async () => {
    const fixture = createFixture(getModelCardRevisionsSchema)
    const res = await testGet(`/api/v2/${fixture.params.modelId}model?notValid`)

    expect(mockModelCardRevision.getModelCardRevisions).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })
})
//test when there is only one model card revision?
//test when there are multiple revisions?
