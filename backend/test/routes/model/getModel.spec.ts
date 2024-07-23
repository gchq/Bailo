import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { getModelSchema } from '../../../src/routes/v2/model/getModel.js'
import { createFixture, testGet } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/connectors/audit/index.js')

describe('routes > model > getModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      getModelById: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(getModelSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      getModelById: vi.fn(() => ({ _id: 'test' })),
    }))

    const fixture = createFixture(getModelSchema)
    const res = await testGet(`/api/v2/model/${fixture.params.modelId}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewModel).toBeCalled()
    expect(audit.onViewModel.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
