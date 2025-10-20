import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { deleteInferenceSchema } from '../../../../src/routes/v2/model/inferencing/deleteInferenceService.js'
import { createFixture, testDelete } from '../../../testUtils/routes.js'

vi.mock('../../../../src/connectors/audit/index.js')

vi.mock('../../../../src/services/inference.js', () => ({
  removeInference: vi.fn(() => ({ _id: 'test', toObject: vi.fn(() => ({ _id: 'test' })) })),
}))

describe('routes > inferencing > deleteInference', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(deleteInferenceSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/inference/example/${fixture.params.tag}`)
    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('404 > bad', async () => {
    const fixtureBad = createFixture(deleteInferenceSchema, { stringMap: { modelId: () => '' } })
    const res = await testDelete(
      `/api/v2/model/${fixtureBad.params.modelId}/inference/example/${fixtureBad.params.tag}`,
    )
    expect(res.statusCode).toBe(404)
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(deleteInferenceSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}/inference/example/${fixture.params.tag}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteInference).toBeCalled()
    expect(audit.onDeleteInference.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
