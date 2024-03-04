import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/audit/__mocks__/index.js'
import { getInferencesSchema } from '../../../../src/routes/v2/model/inferencing/getInferenceServices.js'
import { createFixture, testGet } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/audit/index.js')
vi.mock('../../../../src/connectors/authorisation/index.js')

vi.mock('../../../../src/services/inference.js', () => ({
  getInferencesByModel: vi.fn(() => [{ _id: 'test' }]),
}))

describe('routes > inferencing > getInferences', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(getInferencesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/inferences`)
    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(getInferencesSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}/inferences`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewInferences).toBeCalled()
    expect(audit.onViewInferences.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
