import { Schema as JsonSchema } from 'jsonschema'

import { SchemaAction } from '../../connectors/v2/authorisation/base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import Schema, { SchemaInterface } from '../../models/v2/Schema.js'
import { UserDoc } from '../../models/v2/User.js'
import { SchemaKind, SchemaKindKeys } from '../../types/v2/enums.js'
import config from '../../utils/v2/config.js'
import { Forbidden, NotFound } from '../../utils/v2/error.js'
import { handleDuplicateKeys } from '../../utils/v2/mongo.js'
import log from './log.js'

export interface DefaultSchema {
  name: string
  id: string
  description: string
  jsonSchema: JsonSchema
}

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

export async function createSchema(user: UserDoc, schema: Partial<SchemaInterface>, overwrite = false) {
  const schemaDoc = new Schema(schema)

  const auth = await authorisation.schema(user, schemaDoc, SchemaAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      schemaId: schemaDoc.id,
    })
  }

  if (overwrite) {
    await Schema.deleteOne({ id: schema.id })
  }

  try {
    return await schemaDoc.save()
  } catch (error) {
    handleDuplicateKeys(error)
    throw error
  }
}

export async function addDefaultSchemas() {
  for (const schema of config.defaultSchemas.v2.modelCards) {
    log.info({ name: schema.name, reference: schema.id }, `Ensuring schema ${schema.id} exists`)
    const modelSchema = new Schema({
      ...schema,
      kind: SchemaKind.Model,
      active: true,
      hidden: false,
    })
    await Schema.deleteOne({ id: schema.id })
    await modelSchema.save()
  }

  for (const schema of config.defaultSchemas.v2.accessRequests) {
    log.info({ name: schema.name, reference: schema.id }, `Ensuring schema ${schema.id} exists`)
    const modelSchema = new Schema({
      ...schema,
      kind: SchemaKind.AccessRequest,
      active: true,
      hidden: false,
    })
    await Schema.deleteOne({ id: schema.id })
    await modelSchema.save()
  }
}
