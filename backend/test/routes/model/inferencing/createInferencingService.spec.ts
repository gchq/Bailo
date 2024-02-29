import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/v2/audit/__mocks__/index.js'
import { postInferenceSchema } from '../../../../src/routes/v2/model/inferencing/postInferenceService.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/config.js')
vi.mock('../../../../src/utils/v2/config.js')
vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/v2/audit/index.js')
vi.mock('../../../../src/connectors/v2/authorisation/index.js')

vi.mock('../../../../src/services/v2/inference.js', () => ({
  createInference: vi.fn(() => ({ _id: 'test', toObject: vi.fn(() => ({ _id: 'test' })) })),
}))

describe('routes > inferencing > postInference', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postInferenceSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/inference`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postInferenceSchema)
    const res = await testPost(`/api/v2/model/${fixture.params.modelId}/inference`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateInference).toBeCalled()
    expect(audit.onCreateInference.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
