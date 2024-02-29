import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { putInferenceSchema } from '../../../../src/routes/v2/model/inferencing/putInferenceService.js'
import { createFixture, testPut } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/inference.js', () => ({
  updateInference: vi.fn(() => ({ _id: 'test', toObject: vi.fn(() => ({ _id: 'test' })) })),
}))

describe('routes > inferencing > updateInference', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(putInferenceSchema)
    const res = await testPut(
      `/api/v2/model/${fixture.params.modelId}/inference/example/${fixture.params.tag}`,
      fixture,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(putInferenceSchema)
    const res = await testPut(
      `/api/v2/model/${fixture.params.modelId}/inference/example/${fixture.params.tag}`,
      fixture,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateInference).toBeCalled()
    expect(audit.onUpdateInference.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
