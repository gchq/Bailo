import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/v2/audit/__mocks__/index.js'
import { putSchemaSchema } from '../../../src/routes/v2/schema/patchSchema.js'
import { createFixture, testPut } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/v2/config.js')
vi.mock('../../../src/connectors/v2/audit/index.js')
vi.mock('../../../src/connectors/v2/authorisation/index.js')

const mockSchemaService = vi.hoisted(() => {
  return {
    createSchema: vi.fn(),
  }
})
vi.mock('../../../src/services/v2/schema.js', () => mockSchemaService)

describe('routes > schema > putSchema', async () => {
  test('successfully updates the schema', async () => {
    const fixture = createFixture(putSchemaSchema)
    fixture.body.active = false
    mockSchemaService.createSchema.mockResolvedValue(fixture.body)
    const res = await testPut(`/api/v2/schema/${fixture.body.id}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
    expect(res.body.schema.active).toBe(false)
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(putSchemaSchema)
    mockSchemaService.createSchema.mockResolvedValue(fixture.body)
    const res = await testPut(`/api/v2/schema/${fixture.body.id}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateSchema).toBeCalled()
    expect(audit.onCreateSchema.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
