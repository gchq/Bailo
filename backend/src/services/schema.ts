import traverse from 'json-schema-traverse'
import { Schema as JsonSchema, Validator } from 'jsonschema'
import _ from 'lodash'
import NodeCache from 'node-cache'

import { SchemaAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import ModelModel, { CollaboratorEntry } from '../models/Model.js'
import ReviewRoleModel from '../models/ReviewRole.js'
import SchemaModel, { SchemaDoc, SchemaInterface } from '../models/Schema.js'
import { UserInterface } from '../models/User.js'
import { SchemaKind, SchemaKindKeys } from '../types/enums.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, NotFound } from '../utils/error.js'
import { handleDuplicateKeys } from '../utils/mongo.js'
import log from './log.js'
import { addReviewsForNewRole } from './review.js'

const jsonSchemaValidator = new Validator()
const schemaCache = new NodeCache()
export interface DefaultSchema {
  name: string
  id: string
  description: string
  jsonSchema: JsonSchema
  reviewRoles?: string[]
}

export async function searchSchemas(
  kind?: SchemaKindKeys,
  hidden?: boolean,
  reviewRoles?: string,
  ids?: string[],
): Promise<SchemaDoc[]> {
  const schemas = await SchemaModel.find({
    ...(kind && { kind }),
    ...(hidden != undefined && { hidden }),
    ...(reviewRoles && { reviewRoles }),
    ...(ids && { id: ids }),
  }).sort({ createdAt: -1 })
  return schemas
}

export async function getSchemaById(schemaId: string, modelState?: string): Promise<SchemaInterface> {
  const cachedSchema = schemaCache.get<SchemaInterface>(JSON.stringify({ schemaId, modelState }))
  if (cachedSchema) {
    return cachedSchema
  }
  const schema = await SchemaModel.findOne({
    id: schemaId,
  })

  if (!schema) {
    throw NotFound(`The requested schema was not found.`, { schemaId })
  }

  const schemaObject = schema.toObject()
  schemaObject.jsonSchema = structuredClone(schema.jsonSchema)

  if (modelState) {
    schemaObject.jsonSchema = enforceModelStateFields(schemaObject.jsonSchema, modelState)
  }
  schemaCache.set(JSON.stringify({ schemaId, modelState }), schemaObject)
  return schemaObject
}

function addToParentRequired(
  pointer: string,
  modifiedSchemas: WeakSet<object>,
  parentKeyword?: string,
  parentSchema?: traverse.SchemaObject,
) {
  if (parentKeyword === 'properties' && parentSchema) {
    const propertyName = pointer.replace(/~1/g, '/').replace(/~0/g, '~').split('/').pop()

    if (!parentSchema.required) {
      parentSchema.required = []
    }

    if (!parentSchema.required.includes(propertyName)) {
      parentSchema.required.push(propertyName)
      modifiedSchemas.add(parentSchema)
    }
  }
}

function enforceModelStateFields(schema: object, targetState: string) {
  const validStates = config.ui.modelDetails.states
  if (!validStates.includes(targetState)) {
    throw BadReq('The value for modelState is not a valid model state', { validStates, modelState: targetState })
  }
  const jsonSchema = structuredClone(schema)
  const modifiedSchemas = new WeakSet<object>()

  // Post-order traversal
  traverse(jsonSchema, {
    allKeys: true,
    cb: {
      post: (subschema, pointer, _root, _parentPointer, parentKeyword, parentSchema) => {
        if (!subschema || typeof subschema !== 'object') {
          return
        }

        if (Array.isArray(subschema.requiredByModelStates) && subschema.requiredByModelStates.includes(targetState)) {
          addToParentRequired(pointer, modifiedSchemas, parentKeyword, parentSchema)
        }

        if (modifiedSchemas.has(subschema)) {
          addToParentRequired(pointer, modifiedSchemas, parentKeyword, parentSchema)
        }
      },
    },
  })

  return jsonSchema
}

export async function deleteSchemaById(user: UserInterface, schemaId: string): Promise<string> {
  const schema = await SchemaModel.findOne({
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
  const schemaDoc = new SchemaModel(schema)

  const auth = await authorisation.schema(user, schemaDoc, SchemaAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, {
      userDn: user.dn,
      schemaId: schemaDoc.id,
    })
  }

  if (overwrite) {
    await SchemaModel.deleteOne({ id: schema.id })
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
  const schema = await SchemaModel.findOne({
    id: schemaId,
  })

  if (!schema) {
    throw NotFound(`The requested schema was not found.`, { schemaId })
  }

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

  if (diff.reviewRoles) {
    const models = await ModelModel.find({ 'card.schemaId': schemaId })
    const reviewRoles = await ReviewRoleModel.find({ shortName: { $in: diff.reviewRoles } })
    const roleMap = new Map(reviewRoles.map((role) => [role.shortName, role]))
    for (const model of models) {
      // Remove any roles from model collaborators that have been removed from the schema
      for (const collaborator of model.collaborators) {
        collaborator.roles = collaborator.roles.filter((role) => !removedRoles.includes(role))
      }
      // Update add users/roles based on new defaultEntities
      const updatedCollaborators: CollaboratorEntry[] = [...model.collaborators]
      for (const reviewRoleDiff of diff.reviewRoles) {
        const reviewRole = roleMap.get(reviewRoleDiff)
        if (reviewRole) {
          addReviewsForNewRole(user, reviewRole.toObject(), model)
        }
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
                  roles: [...new Set([...updatedCollaborators[existingIndex].roles, reviewRole.shortName])],
                }
              } else {
                updatedCollaborators.push({
                  entity: defaultEntity,
                  roles: [...new Set([...existingUser.roles, reviewRole.shortName])],
                })
              }
            } else {
              const existingIndex = updatedCollaborators.findIndex(
                (collaborator) => collaborator.entity === defaultEntity,
              )
              if (existingIndex > -1) {
                updatedCollaborators[existingIndex] = {
                  entity: defaultEntity,
                  roles: [...new Set([...updatedCollaborators[existingIndex].roles, reviewRole.shortName])],
                }
              } else {
                updatedCollaborators.push({ entity: defaultEntity, roles: [reviewRole.shortName] })
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
    const modelSchema = new SchemaModel({
      ...schema,
      kind: SchemaKind.Model,
      active: true,
      hidden: false,
    })
    await SchemaModel.deleteOne({ id: schema.id })
    await modelSchema.save()
  }

  for (const schema of config.defaultSchemas.dataCards) {
    log.info({ name: schema.name, reference: schema.id }, `Ensuring schema ${schema.id} exists`)
    const dataCardSchema = new SchemaModel({
      ...schema,
      kind: SchemaKind.DataCard,
      active: true,
      hidden: false,
    })
    await SchemaModel.deleteOne({ id: schema.id })
    await dataCardSchema.save()
  }

  for (const schema of config.defaultSchemas.accessRequests) {
    log.info({ name: schema.name, reference: schema.id }, `Ensuring schema ${schema.id} exists`)
    const modelSchema = new SchemaModel({
      ...schema,
      kind: SchemaKind.AccessRequest,
      active: true,
      hidden: false,
    })
    await SchemaModel.deleteOne({ id: schema.id })
    await modelSchema.save()
  }
}

export async function validateContentAgainstSchema(schemaId: string, content: unknown, modelState?: string) {
  const schema = await getSchemaById(schemaId, modelState)
  const result = jsonSchemaValidator.validate(content, schema.jsonSchema, {
    required: true,
  })
  return {
    valid: result.valid,
    errors: result.errors,
  }
}
