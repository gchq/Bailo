import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { postSchemaSchema } from '../../../src/routes/v2/schema/postSchema.js'
import { SchemaKind } from '../../../src/types/enums.js'
import { createFixture, testPost } from '../../testUtils/routes.js'

vi.mock('../../../src/connectors/audit/index.js')

const mockSchemaService = vi.hoisted(() => {
  return {
    addDefaultSchemas: vi.fn(),
    createSchema: vi.fn(),
  }
})
vi.mock('../../../src/services/schema.js', () => mockSchemaService)

describe('routes > schema > postSchema', async () => {
  test('successfully stores the schema', async () => {
    const fixture = createFixture(postSchemaSchema)
    fixture.body = {
      id: 'test-schema',
      name: 'Test Schema',
      description: 'Test schema description',
      kind: SchemaKind.Model,
      jsonSchema: {},
      reviewRoles: ['reviewer'],
    }
    mockSchemaService.createSchema.mockResolvedValue(fixture.body)
    const res = await testPost(`/api/v2/schemas`, fixture)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postSchemaSchema)
    fixture.body = {
      id: 'test-schema',
      name: 'Test Schema',
      description: 'Test schema description',
      kind: SchemaKind.Model,
      jsonSchema: {},
      reviewRoles: ['reviewer'],
    }
    mockSchemaService.createSchema.mockResolvedValue(fixture.body)
    const res = await testPost(`/api/v2/schemas`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onCreateSchema).toHaveBeenCalled()
    expect(audit.onCreateSchema.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
