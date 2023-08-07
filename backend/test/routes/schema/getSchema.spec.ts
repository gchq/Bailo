import { describe, expect, test, vi } from 'vitest'

import { NotFound } from '../../../src/utils/v2/error.js'
import { testGet } from '../../testUtils/routes.js'
import { testModelSchema } from '../../testUtils/testModels.js'

const mockSchemaService = vi.hoisted(() => {
  return {
    addDefaultSchemas: vi.fn(),
    getSchemaById: vi.fn(),
  }
})
vi.mock('../../../src/services/v2/schema.js', () => mockSchemaService)

describe('routes > schema > getSchema', () => {
  test('returns the schema with the matching ID', async () => {
    mockSchemaService.getSchemaById.mockReturnValueOnce(testModelSchema)
    const res = await testGet(`/api/v2/schema/${testModelSchema.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns the schema with the matching ID', async () => {
    mockSchemaService.getSchemaById.mockRejectedValueOnce(NotFound('Schema not found.'))
    const res = await testGet(`/api/v2/schema/does-not-exist`)

    expect(res.statusCode).toBe(404)
    expect(res.body).matchSnapshot()
  })
})
