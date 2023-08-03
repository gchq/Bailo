import Schema, { SchemaInterface, SchemaKindKeys } from '../../models/v2/Schema.js'
import { testDeploymentSchema, testModelSchema } from '../../../test/testUtils/testModels.js'

export async function findSchemasByKind(kind?: SchemaKindKeys): Promise<SchemaInterface[]> {
  const baseSchemas = await Schema.find({ ...(kind && { kind }) }).sort({ createdAt: -1 })
  return baseSchemas
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
  await createSchema(testModelSchema)
  await createSchema(testDeploymentSchema)
}
