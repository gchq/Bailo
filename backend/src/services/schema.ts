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
const schemaCacheTtlSeconds = 60 * 60 // 1 hour
const schemaCache = new NodeCache({ stdTTL: schemaCacheTtlSeconds })
export interface DefaultSchema {
  name: string
  id: string
  description: string
  jsonSchema: JsonSchema
  reviewRoles?: string[]
}

function deleteCacheKeys(schemaId: string) {
  schemaCache.del(schemaCache.keys().filter((key) => JSON.parse(key).schemaId === schemaId))
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

  return schemas.map((schema) => {
    if (schema.kind === SchemaKind.DeploymentAssessment) {
      schema.jsonSchema = prefixDeploymentAssessmentWithSummary(schema.jsonSchema)
    }
    return schema
  })
}

/**
 * Deployment assessment schemas have some hard-code questions that the application
 * will need to make use of. By appending them using this function, we can keep
 * the actual schema to be purely customisable.
 *
 * @param jsonSchema
 * @returns
 */
function prefixDeploymentAssessmentWithSummary(jsonSchema: JsonSchema) {
  const requiredProperties = Array.isArray(jsonSchema.required) ? jsonSchema.required : []

  return {
    ...structuredClone(jsonSchema),
    properties: {
      overview: {
        title: 'Details',
        type: 'object',
        properties: {
          riskOwner: {
            title: 'Who is the risk owner attached to this deployment assessment?',
            type: 'array',
            items: {
              type: 'string',
              minLength: 1,
            },
            minItems: 1,
            maxItems: 1,
            uniqueItems: true,
            widget: 'entitySelector',
            hideDefaultUser: true,
          },
          justification: {
            title: `Justify why the ${config.ui.roleDisplayNames.riskOwner} has been assigned`,
            type: 'string',
            minLength: 1,
          },
          modelIds: {
            title: 'List all models assigned to this deployment assessment',
            type: 'array',
            items: {
              type: 'string',
              minLength: 1,
            },
            minItems: 1,
            uniqueItems: true,
            widget: 'modelSelector',
          },
        },
        required: ['riskOwner', 'justification', 'modelIds'],
        additionalProperties: false,
      },
      ...jsonSchema.properties,
    },
    required: ['overview', ...requiredProperties.filter((property) => property !== 'overview')],
  }
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

  schema.jsonSchema = enforceModelStateFields(schema.jsonSchema, modelState)

  const schemaObject = schema.toObject()
  schemaObject.jsonSchema = structuredClone(schema.jsonSchema)

  if (schema.kind === SchemaKind.DeploymentAssessment) {
    schemaObject.jsonSchema = prefixDeploymentAssessmentWithSummary(schemaObject.jsonSchema)
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

function addUniqueStates(root: traverse.SchemaObject, states: string[]) {
  const validStates = new Set(config.ui.modelDetails.states)
  root.stateList = Array.from(new Set([...(root.stateList ?? []), ...states.filter((state) => validStates.has(state))]))
}

function enforceModelStateFields(schema: object, targetState?: string) {
  const validStates = config.ui.modelDetails.states
  if (targetState && !validStates.includes(targetState)) {
    throw BadReq('The value for modelState is not a valid model state', { validStates, modelState: targetState })
  }
  const jsonSchema = structuredClone(schema)
  const modifiedSchemas = new WeakSet<object>()

  // Post-order traversal
  traverse(jsonSchema, {
    allKeys: true,
    cb: {
      post: (subschema, pointer, root, _parentPointer, parentKeyword, parentSchema) => {
        if (!subschema || typeof subschema !== 'object') {
          return
        }

        if (Array.isArray(subschema.requiredByModelStates)) {
          if (subschema.requiredByModelStates.includes(targetState)) {
            addToParentRequired(pointer, modifiedSchemas, parentKeyword, parentSchema)
          }
          addUniqueStates(root, subschema.requiredByModelStates)
        }

        if (modifiedSchemas.has(subschema)) {
          addToParentRequired(pointer, modifiedSchemas, parentKeyword, parentSchema)
        }
      },
    },
  })

  return jsonSchema
}

export async function deleteSchemaById(user: UserInterface, schemaId: string): Promise<SchemaDoc> {
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

  deleteCacheKeys(schemaId)

  return schema
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
    await SchemaModel.replaceOne({ id: schema.id }, { ...schema, deleted: false }, { upsert: true })
    const replaced = await SchemaModel.findOne({ id: schema.id })
    if (!replaced) {
      throw NotFound('The schema could not be found after upsert.', { schemaId: schema.id })
    }
    return replaced
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

  deleteCacheKeys(schemaId)

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

async function addSchemas(schemas: DefaultSchema[], kind: SchemaKindKeys) {
  for (const schema of schemas) {
    log.info({ name: schema.name, reference: schema.id }, `Ensuring schema ${schema.id} exists`)
    await SchemaModel.replaceOne(
      { id: schema.id },
      { ...schema, kind, active: true, hidden: false, deleted: false },
      { upsert: true },
    )
  }
}

export async function addDefaultSchemas() {
  await addSchemas(config.defaultSchemas.modelCards, SchemaKind.Model)
  await addSchemas(config.defaultSchemas.dataCards, SchemaKind.DataCard)
  await addSchemas(config.defaultSchemas.accessRequests, SchemaKind.AccessRequest)
  await addSchemas(config.defaultSchemas.deploymentAssessments, SchemaKind.DeploymentAssessment)
}

function makeSchemaOptional(jsonSchema: JsonSchema) {
  const optionalSchema = structuredClone(jsonSchema)
  const requiredForDraft = new WeakSet<object>()
  traverse(optionalSchema, {
    allKeys: true,
    cb: (subschema) => {
      if (subschema && typeof subschema === 'object') {
        delete subschema.required
        delete subschema.minItems
      }
    },
  })
  traverse(optionalSchema, {
    allKeys: true,
    cb: {
      post: (subschema, pointer, _root, _parentPointer, parentKeyword, parentSchema) => {
        if (!subschema || typeof subschema !== 'object') {
          return
        }

        if (subschema.requiredForDraft === true || requiredForDraft.has(subschema)) {
          addToParentRequired(pointer, requiredForDraft, parentKeyword, parentSchema)
        }
      },
    },
  })
  return optionalSchema
}

interface ValidateContentAgainstSchemaOptions {
  modelState?: string
  draft?: boolean
}

export async function validateContentAgainstSchema(
  schemaId: string,
  content: unknown,
  options: ValidateContentAgainstSchemaOptions = {},
) {
  const schema = await getSchemaById(schemaId, options.modelState)
  const jsonSchema = options.draft ? makeSchemaOptional(schema.jsonSchema) : schema.jsonSchema

  const result = jsonSchemaValidator.validate(content, jsonSchema, {
    required: true,
  })
  return {
    valid: result.valid,
    errors: result.errors,
  }
}
