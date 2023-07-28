import Schema, { SchemaInterface, SchemaKind, SchemaKindKeys } from '../../models/v2/Schema.js'
import config from '../../utils/config.js'
import logger from '../../utils/logger.js'

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

export async function addDefaultSchemas() {
  for (const schema of config.defaultSchemas.upload) {
    logger.info({ name: schema.name, reference: schema.reference }, `Ensuring schema ${schema.reference} exists`)
    await createSchema(
      {
        id: 'Default Model Schema',
        name: 'Default Model Schema',
        description: 'Default Model Schema',

        active: true,
        hidden: false,

        kind: SchemaKind.Model,
        meta: {},

        uiSchema: {},
        schema: schema.schema,

        createdAt: new Date(),
        updatedAt: new Date(),
      },
      true
    )
  }

  for (const schema of config.defaultSchemas.deployment) {
    logger.info({ name: schema.name, reference: schema.reference }, `Ensuring schema ${schema.reference} exists`)
    await createSchema(
      {
        id: 'Default Deployment Schema',
        name: 'Default Deployment Schema',
        description: 'Default Deployment Schema',

        active: true,
        hidden: false,

        kind: SchemaKind.Deployment,
        meta: {},

        uiSchema: {},
        schema: schema.schema,

        createdAt: new Date(),
        updatedAt: new Date(),
      },
      true
    )
  }
}
