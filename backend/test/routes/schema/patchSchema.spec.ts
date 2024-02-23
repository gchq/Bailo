import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/audit/__mocks__/index.js'
import { patchSchemaSchema } from '../../../src/routes/v2/schema/patchSchema.js'
import { createFixture, testPatch } from '../../testUtils/routes.js'

vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/v2/config.js')
vi.mock('../../../src/connectors/audit/index.js')
vi.mock('../../../src/connectors/authorisation/index.js')

const mockSchemaService = vi.hoisted(() => {
  return {
    updateSchema: vi.fn(),
  }
})
vi.mock('../../../src/services/v2/schema.js', () => mockSchemaService)

describe('routes > schema > putSchema', async () => {
  test('successfully updates the schema', async () => {
    const fixture = createFixture(patchSchemaSchema)
    mockSchemaService.updateSchema.mockResolvedValue(fixture.body)
    const res = await testPatch('/api/v2/schema/my-schema', { body: { active: false } })

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
    expect(res.body.schema.active).toBe(false)
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(patchSchemaSchema)
    mockSchemaService.updateSchema.mockResolvedValue(fixture.body)
    const res = await testPatch('/api/v2/schema/my-schema', fixture)

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateSchema).toBeCalled()
    expect(audit.onUpdateSchema.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
