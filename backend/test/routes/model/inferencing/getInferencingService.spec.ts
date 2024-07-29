import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getInferenceSchema } from '../../../../src/routes/v2/model/inferencing/getInferenceService.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/inference.js', () => ({
  getInferenceByImage: vi.fn(() => ({ _id: 'test', toObject: vi.fn(() => ({ _id: 'test' })) })),
}))

describe('routes > inferencing > getInference', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getInferenceSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/inference/example/${fixture.params.tag}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getInferenceSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/inference/example/${fixture.params.tag}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewInference).toBeCalled()
    expect(audit.onViewInference.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
