import { Validator } from 'jsonschema'
import _ from 'lodash'

import authentication from '../connectors/authentication/index.js'
import { ModelAction, ModelActionKeys, ReleaseAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import ModelModel, { CollaboratorEntry, EntryKindKeys } from '../models/Model.js'
import Model, { ModelInterface } from '../models/Model.js'
import ModelCardRevisionModel, { ModelCardRevisionDoc } from '../models/ModelCardRevision.js'
import { UserInterface } from '../models/User.js'
import { GetModelCardVersionOptions, GetModelCardVersionOptionsKeys, GetModelFiltersKeys } from '../types/enums.js'
import { EntityKind, EntryUserPermissions } from '../types/types.js'
import { isValidatorResultError } from '../types/ValidatorResultError.js'
import { fromEntity, toEntity } from '../utils/entity.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { authResponseToUserPermission } from '../utils/permissions.js'
import { getSchemaById } from './schema.js'

export function checkModelRestriction(model: ModelInterface) {
  if (model.settings.mirror.sourceModelId) {
    throw BadReq(`Cannot alter a mirrored model.`)
  }
}

export type CreateModelParams = Pick<
  ModelInterface,
  'name' | 'description' | 'visibility' | 'settings' | 'kind' | 'collaborators'
>
export async function createModel(user: UserInterface, modelParams: CreateModelParams) {
  const modelId = convertStringToId(modelParams.name)

  if (modelParams.collaborators) {
    await validateCollaborators(modelParams.collaborators)
  }

  let collaborators: CollaboratorEntry[] = []
  if (modelParams.collaborators && modelParams.collaborators.length > 0) {
    const collaboratorListContainsOwner = modelParams.collaborators.some((collaborator) =>
      collaborator.roles.some((role) => role === 'owner'),
    )
    if (collaboratorListContainsOwner) {
      collaborators = modelParams.collaborators
    } else {
      throw BadReq('At least one collaborator must be given the owner role.')
    }
  } else {
    collaborators = [
      {
        entity: toEntity('user', user.dn),
        roles: ['owner'],
      },
    ]
  }

  const model = new Model({
    ...modelParams,
    id: modelId,
    collaborators,
  })

  const auth = await authorisation.model(user, model, ModelAction.Create)

  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  if (modelParams?.settings?.mirror?.destinationModelId && modelParams?.settings?.mirror?.sourceModelId) {
    throw BadReq('You cannot select both mirror settings simultaneously.')
  }

  await model.save()

  return model
}

export async function getModelById(user: UserInterface, modelId: string, kind?: EntryKindKeys) {
  const model = await Model.findOne({
    id: modelId,
    ...(kind && { kind }),
  })

  if (!model) {
    throw NotFound(`The requested entry was not found.`, { modelId })
  }

  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  return model
}

export async function canUserActionModelById(user: UserInterface, modelId: string, action: ModelActionKeys) {
  // In most cases this function could be done in a single trip by the previous
  // query to the database.  An aggregate query with a 'lookup' can access this
  // data without having to wait.
  //
  // This function is made for simplicity, most functions that call this will
  // only be infrequently called.
  const model = await getModelById(user, modelId)

  const auth = await authorisation.model(user, model, action)
  return auth
}

export async function searchModels(
  user: UserInterface,
  kind: EntryKindKeys,
  libraries: Array<string>,
  filters: Array<GetModelFiltersKeys>,
  search: string,
  task?: string,
  allowTemplating?: boolean,
  schemaId?: string,
): Promise<Array<ModelInterface>> {
  const query: any = {}

  if (kind) {
    query['kind'] = { $all: kind }
  }

  if (libraries.length) {
    query['card.metadata.overview.tags'] = { $all: libraries }
  }

  if (task) {
    if (query['card.metadata.overview.tags']) {
      query['card.metadata.overview.tags'].$all.push(task)
    } else {
      query['card.metadata.overview.tags'] = { $all: [task] }
    }
  }

  if (search) {
    query.$text = { $search: search }
  }

  if (schemaId) {
    query['card.schemaId'] = { $all: schemaId }
  }

  if (allowTemplating) {
    query['settings.allowTemplating'] = true
  }

  for (const filter of filters) {
    // This switch statement is here to ensure we always handle all filters in the 'GetModelFilterKeys'
    // enum.  Eslint will throw an error if we are not exhaustively matching all the enum options,
    // which makes it far harder to forget.
    // The 'Unexpected filter' should never be reached, as we have guaranteed type consistency provided
    // by TypeScript.
    switch (filter) {
      case 'mine':
        query.collaborators = {
          $elemMatch: {
            entity: { $in: await authentication.getEntities(user) },
          },
        }
        break
      default:
        throw BadReq('Unexpected filter', { filter })
    }
  }

  let cursor = ModelModel
    // Find only matching documents
    .find(query)

  if (!search) {
    // Sort by last updated
    cursor = cursor.sort({ updatedAt: -1 })
  } else {
    // Sort by text search
    cursor = cursor.sort({ score: { $meta: 'textScore' } })
  }

  const results = await cursor
  const auths = await authorisation.models(user, results, ModelAction.View)
  return results.filter((_, i) => auths[i].success)
}

export async function getModelCard(
  user: UserInterface,
  modelId: string,
  version: number | GetModelCardVersionOptionsKeys,
) {
  if (version === GetModelCardVersionOptions.Latest) {
    const card = (await getModelById(user, modelId)).card

    if (!card) {
      throw NotFound('This model has no model card setup', { modelId, version })
    }

    return card
  } else {
    return getModelCardRevision(user, modelId, version)
  }
}

export async function getModelCardRevision(user: UserInterface, modelId: string, version: number) {
  const modelCard = await ModelCardRevisionModel.findOne({ modelId, version })
  const model = await getModelById(user, modelId)

  if (!modelCard) {
    throw NotFound(`Version '${version}' does not exist on the requested model`, { modelId, version })
  }

  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  return modelCard
}

export async function getModelCardRevisions(user: UserInterface, modelId: string) {
  const modelCardRevisions = await ModelCardRevisionModel.find({ modelId })

  if (!modelCardRevisions) {
    throw NotFound(`Version '${modelId}' does not exist on the requested model`, { modelId })
  }

  // We don't track the classification of individual model cards.  Instead, we should
  // ensure that the model is accessible to the user.
  const _model = await getModelById(user, modelId)

  return modelCardRevisions
}

// This is an internal function.  Use an equivalent like 'updateModelCard' or 'createModelCardFromSchema'
// if interacting with this from another service.
//
// This function would benefit from transactions, but we currently do not rely on the underlying
// database being a replica set.
export async function _setModelCard(
  user: UserInterface,
  modelId: string,
  schemaId: string,
  version: number,
  metadata: unknown,
) {
  // This function could cause a race case in the 'ModelCardRevision' model.  This
  // is prevented by ensuring there is a compound index on 'modelId' and 'version'.
  //
  // In the event that a race case occurs, the database will throw an error mentioning
  // that there is a duplicate item already found.  This prevents any requirement for
  // a lock on the collection that would likely be a significant slowdown to the query.
  //
  // It is assumed that this race case will occur infrequently.
  const model = await getModelById(user, modelId)

  checkModelRestriction(model)

  const auth = await authorisation.model(user, model, ModelAction.Write)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  // We don't want to copy across other values

  const newDocument = {
    schemaId: schemaId,

    version,
    metadata,
  }

  const revision = new ModelCardRevisionModel({ ...newDocument, modelId, createdBy: user.dn })
  await revision.save()

  await ModelModel.updateOne({ id: modelId }, { $set: { card: newDocument } })

  return revision
}

export async function updateModelCard(
  user: UserInterface,
  modelId: string,
  metadata: unknown,
): Promise<ModelCardRevisionDoc> {
  const model = await getModelById(user, modelId)
  checkModelRestriction(model)

  if (!model.card) {
    throw BadReq(`This model must first be instantiated before it can be `, { modelId })
  }

  const schema = await getSchemaById(model.card.schemaId)
  try {
    new Validator().validate(metadata, schema.jsonSchema, { throwAll: true, required: true })
  } catch (error) {
    if (isValidatorResultError(error)) {
      throw BadReq('Model metadata could not be validated against the schema.', {
        schemaId: model.card.schemaId,
        validationErrors: error.errors,
      })
    }
    throw error
  }

  const revision = await _setModelCard(user, modelId, model.card.schemaId, model.card.version + 1, metadata)
  return revision
}

export type UpdateModelParams = Pick<
  ModelInterface,
  'name' | 'description' | 'visibility' | 'collaborators' | 'state' | 'organisation'
> & {
  settings: Partial<ModelInterface['settings']>
}
export async function updateModel(user: UserInterface, modelId: string, modelDiff: Partial<UpdateModelParams>) {
  const model = await getModelById(user, modelId)
  if (modelDiff.settings?.mirror?.sourceModelId) {
    throw BadReq('Cannot change standard model to be a mirrored model.')
  }
  if (model.settings.mirror.sourceModelId && modelDiff.settings?.mirror?.destinationModelId) {
    throw BadReq('Cannot set a destination model ID for a mirrored model.')
  }
  if (modelDiff.settings?.mirror?.destinationModelId && modelDiff.settings?.mirror?.sourceModelId) {
    throw BadReq('You cannot select both mirror settings simultaneously.')
  }
  if (modelDiff.collaborators) {
    await validateCollaborators(modelDiff.collaborators, model.collaborators)
  }
  if (!modelDiff.organisation) {
    model.organisation = undefined
  }
  if (!modelDiff.state) {
    model.state = undefined
  }

  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  _.mergeWith(model, modelDiff, (a, b) => (_.isArray(b) ? b : undefined))

  // Re-check the authorisation after model has updated
  const recheckAuth = await authorisation.model(user, model, ModelAction.Update)
  if (!recheckAuth.success) {
    throw Forbidden(recheckAuth.info, { userDn: user.dn })
  }
  await model.save()

  return model
}

async function validateCollaborators(
  updatedCollaborators: CollaboratorEntry[],
  previousCollaborators: CollaboratorEntry[] = [],
) {
  const previousCollaboratorEntities: string[] = previousCollaborators.map((collaborator) => collaborator.entity)
  const duplicates = updatedCollaborators.reduce<string[]>(
    (duplicates, currentCollaborator, currentCollaboratorIndex) => {
      if (
        updatedCollaborators.find(
          (collaborator, index) =>
            index !== currentCollaboratorIndex && collaborator.entity === currentCollaborator.entity,
        ) &&
        !duplicates.includes(currentCollaborator.entity)
      ) {
        duplicates.push(currentCollaborator.entity)
      }
      return duplicates
    },
    [],
  )
  if (duplicates.length > 0) {
    throw BadReq(`The following duplicate collaborators have been found: ${duplicates.join(', ')}`)
  }
  const newCollaborators = updatedCollaborators.reduce<string[]>((acc, currentCollaborator) => {
    if (!previousCollaboratorEntities.includes(currentCollaborator.entity)) {
      acc.push(currentCollaborator.entity)
    }
    return acc
  }, [])
  await Promise.all(
    newCollaborators.map(async (collaborator) => {
      if (collaborator === '') {
        throw BadReq('Collaborator name must be a valid string')
      }
      // TODO we currently only check for users, we should consider how we want to handle groups
      const { kind } = fromEntity(collaborator)
      if (kind === EntityKind.USER) {
        await authentication.getUserInformation(collaborator)
      }
    }),
  )
}

export async function createModelCardFromSchema(
  user: UserInterface,
  modelId: string,
  schemaId: string,
): Promise<ModelCardRevisionDoc> {
  const model = await getModelById(user, modelId)
  checkModelRestriction(model)

  const auth = await authorisation.model(user, model, ModelAction.Write)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  if (model.card?.schemaId) {
    throw BadReq('This model already has a model card.', { modelId })
  }

  // Ensure schema exists
  const schema = await getSchemaById(schemaId)
  if (schema.hidden) {
    throw BadReq('Cannot create a new Card using a hidden schema.', { schemaId, kind: schema.kind })
  }

  const revision = await _setModelCard(user, modelId, schemaId, 1, {})
  return revision
}

export async function createModelCardFromTemplate(
  user: UserInterface,
  modelId: string,
  templateId: string,
): Promise<ModelCardRevisionDoc> {
  if (modelId === templateId) {
    throw BadReq('The model and template ID must be different', { modelId, templateId })
  }
  const model = await getModelById(user, modelId)
  if (model.card?.schemaId) {
    throw BadReq('This model already has a model card.', { modelId })
  }
  checkModelRestriction(model)
  const template = await getModelById(user, templateId)
  // Check to make sure user can access the template. We already check for the model auth later on in _setModelCard
  const templateAuth = await authorisation.model(user, template, ModelAction.View)
  if (!templateAuth.success) {
    throw Forbidden(templateAuth.info, { userDn: user.dn, templateId })
  }

  if (!template.card?.schemaId) {
    throw BadReq('The template model is missing a model card', { modelId, templateId })
  }
  const revision = await _setModelCard(user, modelId, template.card.schemaId, 1, template.card.metadata)
  return revision
}

export async function saveImportedModelCard(modelCardRevision: Omit<ModelCardRevisionDoc, '_id'>) {
  const schema = await getSchemaById(modelCardRevision.schemaId)
  try {
    new Validator().validate(modelCardRevision.metadata, schema.jsonSchema, { throwAll: true, required: true })
  } catch (error) {
    if (isValidatorResultError(error)) {
      throw BadReq('Model metadata could not be validated against the schema.', {
        schemaId: modelCardRevision.schemaId,
        validationErrors: error.errors,
      })
    }
    throw error
  }

  const foundModelCardRevision = await ModelCardRevisionModel.findOneAndUpdate(
    { modelId: modelCardRevision.modelId, version: modelCardRevision.version },
    modelCardRevision,
    {
      upsert: true,
    },
  )

  if (!foundModelCardRevision && modelCardRevision.version !== 1) {
    // This model card did not already exist in Mongo, so it is a new model card. Return it to be audited.
    // Ignore model cards with a version number of 1 as these will always be blank.
    return modelCardRevision
  }
}

/**
 * Note that we do not authorise that the user can access the model here.
 * This function should only be used during the import model card process.
 * Do not expose this functionality to users.
 */
export async function setLatestImportedModelCard(modelId: string) {
  const latestModelCard = await ModelCardRevisionModel.findOne({ modelId }, undefined, { sort: { version: -1 } })
  if (!latestModelCard) {
    throw NotFound('Cannot find latest model card.', { modelId })
  }

  const updatedModel = await ModelModel.findOneAndUpdate(
    { id: modelId, 'settings.mirror.sourceModelId': { $exists: true, $ne: '' } },
    { $set: { card: latestModelCard } },
    { returnOriginal: false },
  )
  if (!updatedModel) {
    throw InternalError('Unable to set latest model card of mirrored model.', {
      modelId,
      version: latestModelCard.version,
    })
  }

  return updatedModel
}

export async function validateMirroredModel(mirroredModelId: string, sourceModelId: string) {
  const model = await Model.findOne({
    id: mirroredModelId,
    'settings.mirror.sourceModelId': { $ne: null },
  })

  if (!model) {
    throw NotFound(`The requested mirrored model entry was not found.`, { modelId: mirroredModelId })
  }

  if (model.settings.mirror.sourceModelId !== sourceModelId) {
    throw InternalError('The source model ID of the mirrored model does not match the model Id of the imported model', {
      sourceModelId: model.settings.mirror.sourceModelId,
      importedModelId: sourceModelId,
    })
  }

  return model
}

export function isModelCardRevisionDoc(data: unknown): data is ModelCardRevisionDoc {
  if (typeof data !== 'object' || data === null) {
    return false
  }
  // Hard to debug
  if (
    !('modelId' in data) ||
    !('schemaId' in data) ||
    !('version' in data) ||
    !('createdBy' in data) ||
    !('updatedAt' in data) ||
    !('createdAt' in data) ||
    !('_id' in data)
  ) {
    return false
  }
  return true
}

export async function getCurrentUserPermissionsByModel(
  user: UserInterface,
  modelId: string,
): Promise<EntryUserPermissions> {
  const model = await getModelById(user, modelId)

  const editEntryAuth = await authorisation.model(user, model, ModelAction.Update)
  const editEntryCardAuth = await authorisation.model(user, model, ModelAction.Write)
  const createReleaseAuth = await authorisation.release(user, model, ReleaseAction.Create)
  const editReleaseAuth = await authorisation.release(user, model, ReleaseAction.Update)
  const deleteReleaseAuth = await authorisation.release(user, model, ReleaseAction.Delete)
  const pushModelImageAuth = await authorisation.image(user, model, {
    type: 'repository',
    name: modelId,
    actions: ['push'],
  })
  // Inferencing uses model authorisation
  const createInferenceServiceAuth = await authorisation.model(user, model, ModelAction.Create)
  const editInferenceServiceAuth = await authorisation.model(user, model, ModelAction.Update)
  const exportMirroredModelAuth = await authorisation.model(user, model, ModelAction.Update)

  return {
    editEntry: authResponseToUserPermission(editEntryAuth),
    editEntryCard: authResponseToUserPermission(editEntryCardAuth),

    createRelease: authResponseToUserPermission(createReleaseAuth),
    editRelease: authResponseToUserPermission(editReleaseAuth),
    deleteRelease: authResponseToUserPermission(deleteReleaseAuth),

    pushModelImage: authResponseToUserPermission(pushModelImageAuth),

    createInferenceService: authResponseToUserPermission(createInferenceServiceAuth),
    editInferenceService: authResponseToUserPermission(editInferenceServiceAuth),

    exportMirroredModel: authResponseToUserPermission(exportMirroredModelAuth),
  }
}
