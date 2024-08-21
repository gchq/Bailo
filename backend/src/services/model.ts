import { Validator } from 'jsonschema'
import _ from 'lodash'

import authentication from '../connectors/authentication/index.js'
import { ModelAction, ModelActionKeys } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import ModelModel, { CollaboratorEntry, EntryKindKeys } from '../models/Model.js'
import Model, { ModelInterface } from '../models/Model.js'
import ModelCardRevisionModel, { ModelCardRevisionDoc } from '../models/ModelCardRevision.js'
import { UserInterface } from '../models/User.js'
import { GetModelCardVersionOptions, GetModelCardVersionOptionsKeys, GetModelFiltersKeys } from '../types/enums.js'
import { isValidatorResultError } from '../types/ValidatorResultError.js'
import { toEntity } from '../utils/entity.js'
import { BadReq, Forbidden, NotFound } from '../utils/error.js'
import { convertStringToId } from '../utils/id.js'
import { findSchemaById } from './schema.js'

export function checkModelRestriction(model: ModelInterface) {
  if (model.settings.mirror.sourceModelId) {
    throw BadReq(`Cannot alter a mirrored model.`)
  }
}

export type CreateModelParams = Pick<
  ModelInterface,
  'name' | 'teamId' | 'description' | 'visibility' | 'settings' | 'kind' | 'collaborators'
>
export async function createModel(user: UserInterface, modelParams: CreateModelParams) {
  const modelId = convertStringToId(modelParams.name)

  // TODO - Find team by teamId to check it's valid. Throw error if not found.

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

  const schema = await findSchemaById(model.card.schemaId)
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

export type UpdateModelParams = Pick<ModelInterface, 'name' | 'teamId' | 'description' | 'visibility'> & {
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

  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  _.mergeWith(model, modelDiff, (a, b) => (_.isArray(b) ? b : undefined))
  await model.save()

  return model
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
  await findSchemaById(schemaId)

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
