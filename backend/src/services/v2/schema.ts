import { testDeploymentSchema, testModelSchema } from '../../../test/testUtils/testModels.js'
import Schema, { SchemaInterface } from '../../models/v2/Schema.js'
import modelSchemaBeta from '../../scripts/example_schemas/minimal_upload_schema_beta.json' assert { type: 'json' }
import { SchemaKind, SchemaKindKeys } from '../../types/v2/enums.js'
import { BadReq, NotFound } from '../../utils/v2/error.js'
import { isMongoServerError } from '../../utils/v2/mongo.js'

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

export async function createSchema(schema: Partial<SchemaInterface>, overwrite = false) {
  if (overwrite) {
    await Schema.deleteOne({ id: schema.id })
  }

  const schemaDoc = new Schema(schema)

  try {
    return await schemaDoc.save()
  } catch (error) {
    if (isMongoServerError(error) && error.code == 11000) {
      throw BadReq(`The following is not unique: ${JSON.stringify(error.keyValue)}`)
    }
    throw error
  }
}

/**
 * Use the mock data as defaults
 * TODO - convert and use default schemas from V1
 */
export async function addDefaultSchemas() {
  await createSchema(testDeploymentSchema, true)

  await createSchema(
    {
      name: 'Minimal Schema v10 Beta',
      id: 'minimal-general-v10-beta',
      description: 'This is a test beta schema',
      jsonSchema: modelSchemaBeta,
      kind: SchemaKind.Model,
      active: true,
      hidden: false,
    },
    true
  )
}
