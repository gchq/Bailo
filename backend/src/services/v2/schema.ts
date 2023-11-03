import { SchemaAction } from '../../connectors/v2/authorisation/Base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import Schema, { SchemaInterface } from '../../models/v2/Schema.js'
import { UserDoc } from '../../models/v2/User.js'
import accessRequestSchemaBeta from '../../scripts/example_schemas/minimal_access_request_schema_beta.json' assert { type: 'json' }
import modelSchemaBeta from '../../scripts/example_schemas/minimal_upload_schema_beta.json' assert { type: 'json' }
import { SchemaKind, SchemaKindKeys } from '../../types/v2/enums.js'
import { Forbidden, NotFound } from '../../utils/v2/error.js'
import { handleDuplicateKeys } from '../../utils/v2/mongo.js'

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

  if (!(await authorisation.userSchemaAction(user, schemaDoc, SchemaAction.Create))) {
    throw Forbidden(`You do not have permission to create this schema.`, {
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
  const uploadSchemaDoc = new Schema({
    name: 'Minimal Schema v10 Beta',
    id: 'minimal-general-v10-beta',
    description: 'This is a test beta schema',
    jsonSchema: modelSchemaBeta,
    kind: SchemaKind.Model,
    active: true,
    hidden: false,
  })

  const accessSchemaDoc = new Schema({
    name: 'Minimal Access RequestSchema v10 Beta',
    id: 'minimal-access-request-general-v10-beta',
    description: 'This is a test beta schema',
    jsonSchema: accessRequestSchemaBeta,
    kind: SchemaKind.AccessRequest,
    active: true,
    hidden: false,
  })

  await Schema.deleteMany({ $or: [{ id: uploadSchemaDoc.id }, { id: accessSchemaDoc.id }] })

  try {
    await uploadSchemaDoc.save()
    await accessSchemaDoc.save()
  } catch (error) {
    handleDuplicateKeys(error)
    throw error
  }
}
