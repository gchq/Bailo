import { testDeploymentSchema, testModelSchema } from '../../../test/testUtils/testModels.js'
import Schema, { SchemaInterface } from '../../models/v2/Schema.js'
import { SchemaKindKeys } from '../../types/v2/enums.js'
import { NotFound } from '../../utils/v2/error.js'

export async function findSchemasByKind(kind?: SchemaKindKeys): Promise<SchemaInterface[]> {
  const baseSchemas = await Schema.find({ ...(kind && { kind }) }).sort({ createdAt: -1 })
  return baseSchemas
}

export async function findSchemaById(schemaId: string): Promise<SchemaInterface> {
  const schema = await Schema.findOne({
    id: schemaId,
  })

  if (!schema) {
    throw NotFound(`The requested schema was not found.`, { schemaId })
  }

  return schema
}

export async function createSchema(schema: SchemaInterface, overwrite = false) {
  if (overwrite) {
    await Schema.deleteOne({ id: schema.id })
  }

  const schemaDoc = new Schema(schema)

  return schemaDoc.save()
}

/**
 * Use the mock data as defaults
 * TODO - convert and use default schemas from V1
 */
export async function addDefaultSchemas() {
  await createSchema(testModelSchema, true)
  await createSchema(testDeploymentSchema, true)
}
