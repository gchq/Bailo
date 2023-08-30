import _ from 'lodash'
import { describe, expect, test, vi } from 'vitest'

import { schemaJson } from '../../../src/scripts/example_schemas/minimal_upload_schema_beta.js'
import { NotFound } from '../../../src/utils/v2/error.js'
import { testGet } from '../../testUtils/routes.js'
import { testModelSchema } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')

const mockSchemaService = vi.hoisted(() => {
  return {
    addDefaultSchemas: vi.fn(),
    findSchemaById: vi.fn(),
  }
})
vi.mock('../../../src/services/v2/schema.js', () => mockSchemaService)

describe('routes > schema > getSchema', () => {
  test('returns the schema with the matching ID', async () => {
    const updatedTestSchema = _.cloneDeep(testModelSchema)
    updatedTestSchema.schema = schemaJson
    mockSchemaService.findSchemaById.mockReturnValueOnce(updatedTestSchema)
    const res = await testGet(`/api/v2/schema/${testModelSchema.id}`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns the schema with the matching ID', async () => {
    mockSchemaService.findSchemaById.mockRejectedValueOnce(NotFound('Schema not found.'))
    const res = await testGet(`/api/v2/schema/does-not-exist`)

    expect(res.statusCode).toBe(404)
    expect(res.body).matchSnapshot()
  })
})
