import { Schema as JsonSchema } from 'jsonschema'

import { SchemaAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import ModelModel, { CollaboratorEntry } from '../models/Model.js'
import ReviewRoleModel from '../models/ReviewRole.js'
import Schema, { SchemaInterface } from '../models/Schema.js'
import SchemaModel from '../models/Schema.js'
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
  reviewRoles?: string[]
}

export async function searchSchemas(kind?: SchemaKindKeys, hidden?: boolean): Promise<SchemaInterface[]> {
  const schemas = await Schema.find({
    ...(kind && { kind }),
    ...(hidden != undefined && { hidden }),
  }).sort({ createdAt: -1 })
  return schemas
}

export async function getSchemaById(schemaId: string) {
  const schema = await Schema.findOne({
    id: schemaId,
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

  await schema.deleteOne()

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

export type UpdateSchemaParams = Partial<
  Pick<SchemaInterface, 'active' | 'hidden' | 'name' | 'description' | 'reviewRoles'>
>

export async function updateSchema(user: UserInterface, schemaId: string, diff: UpdateSchemaParams) {
  const schema = await getSchemaById(schemaId)

  const auth = await authorisation.schema(user, schema, SchemaAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      schemaId: schema.id,
    })
  }

  // Check if any review roles have been removed
  let removedRoles: string[] = []
  if (diff.reviewRoles) {
    removedRoles = schema.reviewRoles.filter((role) => !diff.reviewRoles?.includes(role))
  }

  Object.assign(schema, diff)
  await schema.save()

  // Find out why roles are duplicating!
  if (diff.reviewRoles) {
    const models = await ModelModel.find({ 'card.schemaId': schemaId })
    for (const model of models) {
      // Remove any roles from model collaborators that have been removed from the schema
      for (const collaborator of model.collaborators) {
        collaborator.roles = collaborator.roles.filter((role) => !removedRoles.includes(role))
      }
      // Update add users/roles based on new defaultEntities
      const updatedCollaborators: CollaboratorEntry[] = [...model.collaborators]
      for (const reviewRoleDiff of diff.reviewRoles) {
        const reviewRole = await ReviewRoleModel.findOne({ short: reviewRoleDiff })
        if (reviewRole && reviewRole.defaultEntities) {
          for (const defaultEntity of reviewRole.defaultEntities) {
            const existingUser = model.collaborators.find((collaborator) => collaborator.entity === defaultEntity)
            if (existingUser) {
              const existingIndex = updatedCollaborators.findIndex(
                (collaborator) => collaborator.entity === defaultEntity,
              )
              if (existingIndex > -1) {
                updatedCollaborators[existingIndex] = {
                  entity: defaultEntity,
                  roles: [...new Set([...updatedCollaborators[existingIndex].roles, reviewRole.short])],
                }
              } else {
                updatedCollaborators.push({
                  entity: defaultEntity,
                  roles: [...new Set([...existingUser.roles, reviewRole.short])],
                })
              }
            } else {
              const existingIndex = updatedCollaborators.findIndex(
                (collaborator) => collaborator.entity === defaultEntity,
              )
              if (existingIndex > -1) {
                updatedCollaborators[existingIndex] = {
                  entity: defaultEntity,
                  roles: [...new Set([...updatedCollaborators[existingIndex].roles, reviewRole.short])],
                }
              } else {
                updatedCollaborators.push({ entity: defaultEntity, roles: [reviewRole.short] })
              }
            }
          }
        }
      }
      model.collaborators = updatedCollaborators
      await model.save()
    }
  }

  return schema
}

export async function addDefaultSchemas() {
  for (const schema of config.defaultSchemas.modelCards) {
    log.info({ name: schema.name, reference: schema.id }, `Ensuring schema ${schema.id} exists`)
    const existingSchema = await SchemaModel.findOne({ id: schema.id })
    if (!existingSchema) {
      const modelSchema = new Schema({
        ...schema,
        kind: SchemaKind.Model,
        active: true,
        hidden: false,
      })
      await Schema.deleteOne({ id: schema.id })
      await modelSchema.save()
    }
  }

  for (const schema of config.defaultSchemas.dataCards) {
    log.info({ name: schema.name, reference: schema.id }, `Ensuring schema ${schema.id} exists`)
    const existingSchema = await SchemaModel.findOne({ id: schema.id })
    if (!existingSchema) {
      const dataCardSchema = new Schema({
        ...schema,
        kind: SchemaKind.DataCard,
        active: true,
        hidden: false,
      })
      await Schema.deleteOne({ id: schema.id })
      await dataCardSchema.save()
    }
  }

  for (const schema of config.defaultSchemas.accessRequests) {
    log.info({ name: schema.name, reference: schema.id }, `Ensuring schema ${schema.id} exists`)
    const existingSchema = await SchemaModel.findOne({ id: schema.id })
    if (!existingSchema) {
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
}
