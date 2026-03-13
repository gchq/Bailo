import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { deleteModelSchema } from '../../../src/routes/v2/model/deleteModel.js'
import { createFixture, testDelete } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

describe('routes > model > deleteModel', () => {
  test('200 > ok', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      removeModel: vi.fn(),
    }))

    const fixture = createFixture(deleteModelSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    vi.mock('../../../src/services/model.js', () => ({
      removeModel: vi.fn(),
    }))

    const fixture = createFixture(deleteModelSchema)
    const res = await testDelete(`/api/v2/model/${fixture.params.modelId}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteModel).toBeCalled()
    expect(audit.onDeleteModel.mock.calls.at(0)?.at(1)).toMatchSnapshot()
    expect(audit.onDeleteModel.mock.calls.at(0)?.at(2)).toMatchSnapshot()
  })
})
