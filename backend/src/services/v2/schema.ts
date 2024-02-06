import { SchemaAction } from '../../connectors/v2/authorisation/base.js'
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

export async function findSchemaById(schemaId: string) {
  const schema = await Schema.findOne({
    id: schemaId,
  })

  if (!schema) {
    throw NotFound(`The requested schema was not found.`, { schemaId })
  }

  return schema
}

export async function deleteSchemaById(user: UserDoc, schemaId: string): Promise<string> {
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

export type UpdateSchemaParams = Pick<SchemaInterface, 'active'>

export async function updateSchema(user: UserDoc, schemaId: string, diff: Partial<UpdateSchemaParams>) {
  const schema = await findSchemaById(schemaId)

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
  const uploadSchemaDoc = new Schema({
    name: 'Minimal Schema v10 Beta',
    id: 'minimal-general-v10-beta',
    description:
      "This is the latest version of the default model card for users from West. It complies with all requirements laid out in the [AI Policy](https://example.com) as well as best practices recommended by 'Science and Research'.\n\nIf you're unsure which model card to pick, you'll likely want this one!",
    jsonSchema: modelSchemaBeta,
    kind: SchemaKind.Model,
    active: true,
    hidden: false,
  })

  const accessSchemaDoc = new Schema({
    name: 'Minimal Access Request Schema v10 Beta',
    id: 'minimal-access-request-general-v10-beta',
    description:
      'This access request should be used for models that are being deployed by the same organisation that created it and MAY be being used for operational use cases.\n\n ✔ Development Work  \n ✔ Operational Deployments  \n ✖ Second Party Sharing',
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
