import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { patchSchemaSchema } from '../../../src/routes/v2/schema/patchSchema.js'
import { createFixture, testPatch } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

const mockSchemaService = vi.hoisted(() => {
  return {
    updateSchema: vi.fn(),
  }
})
vi.mock('../../../src/services/schema.js', () => mockSchemaService)

describe('routes > schema > patchSchema', async () => {
  test('successfully updates the schema', async () => {
    const fixture = createFixture(patchSchemaSchema)
    mockSchemaService.updateSchema.mockResolvedValue(fixture.body)
    const res = await testPatch(`/api/v2/schema/${fixture.params.schemaId}`, {
      body: { active: false, hidden: false, name: fixture.body.name, description: fixture.body.description },
    })

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
    expect(res.body.schema.active).toBe(fixture.body.active)
    expect(res.body.schema.hidden).toBe(fixture.body.hidden)
    expect(res.body.schema.name).toBe(fixture.body.name)
    expect(res.body.schema.description).toBe(fixture.body.description)
  })

  test('throws 400 when trying to update id property', async () => {
    const fixture = createFixture(patchSchemaSchema)
    mockSchemaService.updateSchema.mockResolvedValue(fixture.body)
    const res = await testPatch(`/api/v2/schema/${fixture.params.schemaId}`, {
      body: { id: 'new-id' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(patchSchemaSchema)
    mockSchemaService.updateSchema.mockResolvedValue(fixture.body)
    const res = await testPatch(`/api/v2/schema/${fixture.params.schemaId}`, fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateSchema).toBeCalled()
    expect(audit.onUpdateSchema.mock.calls.at(0)?.at(1)).toMatchSnapshot()
  })
})
