import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { deleteSchemaSchema } from '../../../src/routes/v2/schema/deleteSchema.js'
import { createFixture, testDelete } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/v2/config.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

const mockSchemaService = vi.hoisted(() => {
  return {
    deleteSchema: vi.fn(),
    deleteSchemaById: vi.fn(() => true),
  }
})
vi.mock('../../../src/services/v2/schema.js', () => mockSchemaService)

describe('routes > schema > deleteSchema', async () => {
  test('successfully updates the schema', async () => {
    const fixture = createFixture(deleteSchemaSchema)
    mockSchemaService.deleteSchema.mockResolvedValue(fixture.params.schemaId)
    const res = await testDelete(`/api/v2/schema/${fixture.params.schemaId}`)

    expect(res.status).toBe(200)
    expect(res.body).matchSnapshot()
    expect(res.body.deleted).toBe(true)
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(deleteSchemaSchema)
    mockSchemaService.deleteSchema.mockResolvedValue(fixture.params.schemaId)
    const res = await testDelete(`/api/v2/schema/${fixture.params.schemaId}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onDeleteSchema).toBeCalled()
    expect(audit.onDeleteSchema.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
