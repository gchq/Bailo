import { describe, expect, test, vi } from 'vitest'

import audit from '../../../src/connectors/v2/audit/__mocks__/index.js'
import { NotFound } from '../../../src/utils/v2/error.js'
import { testGet } from '../../testUtils/routes.js'
import { testModelSchema } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')
vi.mock('../../../src/utils/v2/config.js')
vi.mock('../../../src/connectors/v2/audit/index.js')
vi.mock('../../../src/connectors/v2/authorisation/index.js')

const mockSchemaService = vi.hoisted(() => {
  return {
    addDefaultSchemas: vi.fn(),
    findSchemaById: vi.fn(),
  }
})
vi.mock('../../../src/services/v2/schema.js', () => mockSchemaService)

describe('routes > schema > getSchema', () => {
  test('returns the schema with the matching ID', async () => {
    mockSchemaService.findSchemaById.mockReturnValueOnce(testModelSchema)
    const res = await testGet(`/api/v2/schema/${testModelSchema.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    mockSchemaService.findSchemaById.mockReturnValueOnce(testModelSchema)
    const res = await testGet(`/api/v2/schema/${testModelSchema.id}`)

    expect(res.statusCode).toBe(200)
    expect(audit.onViewSchema).toBeCalled()
    expect(audit.onViewSchema.mock.calls.at(0).at(1)).toMatchSnapshot()
  })

  test('returns the schema with the matching ID', async () => {
    mockSchemaService.findSchemaById.mockRejectedValueOnce(NotFound('Schema not found.'))
    const res = await testGet(`/api/v2/schema/does-not-exist`)

    expect(res.statusCode).toBe(404)
    expect(res.body).matchSnapshot()
  })
})
