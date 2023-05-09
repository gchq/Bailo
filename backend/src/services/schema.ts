import SchemaModel, { Schema } from '../models/Schema.js'
import config from '../utils/config.js'
import logger from '../utils/logger.js'

export async function findSchemaByRef(ref: string) {
  const schema = await SchemaModel.findOne({
    reference: ref,
  })

  return schema
}

export async function findSchemaByName(name: string) {
  const schema = await SchemaModel.findOne({
    name,
  })

  return schema
}

export async function findSchemasByUse(use: string, limit?: number) {
  const baseSchemas = SchemaModel.find({ use }).sort({ createdAt: -1 })
  if (limit) baseSchemas.limit(limit)

  return baseSchemas
}

export async function createSchema(schema: Schema, overwrite = false) {
  if (overwrite) {
    await SchemaModel.deleteOne({ reference: schema.reference })
  }

  const schemaDoc = new SchemaModel(schema)

  return schemaDoc.save()
}

export async function addDefaultSchemas() {
  for (const schema of config.defaultSchemas.upload) {
    logger.info({ name: schema.name, reference: schema.reference }, `Ensuring schema ${schema.reference} exists`)
    await createSchema({ ...schema, use: 'UPLOAD' }, true)
  }

  for (const schema of config.defaultSchemas.deployment) {
    logger.info({ name: schema.name, reference: schema.reference }, `Ensuring schema ${schema.reference} exists`)
    await createSchema({ ...schema, use: 'DEPLOYMENT' }, true)
  }
}
