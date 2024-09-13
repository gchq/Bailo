import { Schema as JsonSchema } from 'jsonschema'

import { SchemaAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import Schema, { SchemaInterface } from '../models/Schema.js'
import { UserInterface } from '../models/User.js'
import { SchemaKind, SchemaKindKeys } from '../types/enums.js'
import config from '../utils/config.js'
import { Forbidden, NotFound } from '../utils/error.js'
import { handleDuplicateKeys } from '../utils/mongo.js'
import log from './log.js'

export interface DefaultSchema {
  name: string
  id: string
  description: string
  jsonSchema: JsonSchema
}

export async function findSchemasByKind(kind?: SchemaKindKeys): Promise<SchemaInterface[]> {
  const baseSchemas = await Schema.find({ ...(kind && { kind }), hidden: false }).sort({ createdAt: -1 })
  return baseSchemas
}

export async function findSchemaById(schemaId: string, includeHidden = false) {
  const schema = await Schema.findOne({
    id: schemaId,
    ...(!includeHidden && { hidden: false }),
  })

  if (!schema) {
    throw NotFound(`The requested schema was not found.`, { schemaId })
  }

  return schema
}

export async function deleteSchemaById(user: UserInterface, schemaId: string): Promise<string> {
  const schema = await Schema.findOne({
    id: schemaId,
  })

  if (!schema) {
    throw NotFound(`The requested schema was not found.`, { schemaId })
  }

  const auth = await authorisation.schema(user, schema, SchemaAction.Delete)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      schemaId: schema.id,
    })
  }

  await schema.delete()

  return schema.id
}

export async function createSchema(user: UserInterface, schema: Partial<SchemaInterface>, overwrite = false) {
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

export type UpdateSchemaParams = Pick<SchemaInterface, 'active'>

export async function updateSchema(user: UserInterface, schemaId: string, diff: Partial<UpdateSchemaParams>) {
  const schema = await findSchemaById(schemaId, true)

  const auth = await authorisation.schema(user, schema, SchemaAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      schemaId: schema.id,
    })
  }

  Object.assign(schema, diff)
  await schema.save()

  return schema
}

export async function addDefaultSchemas() {
  for (const schema of config.defaultSchemas.modelCards) {
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

  for (const schema of config.defaultSchemas.dataCards) {
    log.info({ name: schema.name, reference: schema.id }, `Ensuring schema ${schema.id} exists`)
    const dataCardSchema = new Schema({
      ...schema,
      kind: SchemaKind.DataCard,
      active: true,
      hidden: false,
    })
    await Schema.deleteOne({ id: schema.id })
    await dataCardSchema.save()
  }

  for (const schema of config.defaultSchemas.accessRequests) {
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
