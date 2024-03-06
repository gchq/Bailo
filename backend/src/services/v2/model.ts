import { Validator } from 'jsonschema'

import authentication from '../../connectors/v2/authentication/index.js'
import { ModelAction, ModelActionKeys } from '../../connectors/v2/authorisation/base.js'
import authorisation from '../../connectors/v2/authorisation/index.js'
import ModelModel from '../../models/v2/Model.js'
import Model, { ModelInterface } from '../../models/v2/Model.js'
import ModelCardRevisionModel, { ModelCardRevisionDoc } from '../../models/v2/ModelCardRevision.js'
import { UserDoc } from '../../models/v2/User.js'
import {
  GetModelCardVersionOptions,
  GetModelCardVersionOptionsKeys,
  GetModelFiltersKeys,
} from '../../types/v2/enums.js'
import { isValidatorResultError } from '../../types/v2/ValidatorResultError.js'
import { toEntity } from '../../utils/v2/entity.js'
import { BadReq, Forbidden, NotFound } from '../../utils/v2/error.js'
import { convertStringToId } from '../../utils/v2/id.js'
import { findSchemaById } from './schema.js'

export type CreateModelParams = Pick<ModelInterface, 'name' | 'teamId' | 'description' | 'visibility'>
export async function createModel(user: UserDoc, modelParams: CreateModelParams) {
  const modelId = convertStringToId(modelParams.name)

  // TODO - Find team by teamId to check it's valid. Throw error if not found.

  const model = new Model({
    ...modelParams,
    id: modelId,
    collaborators: [
      {
        entity: toEntity('user', user.dn),
        roles: ['owner', 'msro', 'mtr'],
      },
    ],
  })

  const auth = await authorisation.model(user, model, ModelAction.Create)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  await model.save()

  return model
}

export async function getModelById(user: UserDoc, modelId: string) {
  const model = await Model.findOne({
    id: modelId,
  })

  if (!model) {
    throw NotFound(`The requested model was not found.`, { modelId })
  }

  const auth = await authorisation.model(user, model, ModelAction.View)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  return model
}

export async function canUserActionModelById(user: UserDoc, modelId: string, action: ModelActionKeys) {
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
  user: UserDoc,
  libraries: Array<string>,
  filters: Array<GetModelFiltersKeys>,
  search: string,
  task?: string,
): Promise<Array<ModelInterface>> {
  const query: any = {}

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

  for (const filter of filters) {
    // This switch statement is here to ensure we always handle all filters in the 'GetModelFilterKeys'
    // enum.  Eslint will throw an error if we are not exhaustiviely matching all the enum options,
    // which makes it far harder to forget.
    // The 'Unexpected filter' should never be reached, as we have guarenteed type consistency provided
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

  const results = await ModelModel
    // Find only matching documents
    .find(query)
    // Sort by last updated
    .sort({ updatedAt: -1 })

  const auths = await authorisation.models(user, results, ModelAction.View)
  return results.filter((_, i) => auths[i].success)
}

export async function getModelCard(user: UserDoc, modelId: string, version: number | GetModelCardVersionOptionsKeys) {
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

export async function getModelCardRevision(user: UserDoc, modelId: string, version: number) {
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

export async function getModelCardRevisions(user: UserDoc, modelId: string) {
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
  user: UserDoc,
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
  user: UserDoc,
  modelId: string,
  metadata: unknown,
): Promise<ModelCardRevisionDoc> {
  const model = await getModelById(user, modelId)

  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

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

export type UpdateModelParams = Pick<
  ModelInterface,
  'name' | 'description' | 'visibility' | 'collaborators' | 'settings'
>
export async function updateModel(user: UserDoc, modelId: string, diff: Partial<UpdateModelParams>) {
  const model = await getModelById(user, modelId)

  const auth = await authorisation.model(user, model, ModelAction.Update)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn })
  }

  Object.assign(model, diff)
  await model.save()

  return model
}

export async function createModelCardFromSchema(
  user: UserDoc,
  modelId: string,
  schemaId: string,
): Promise<ModelCardRevisionDoc> {
  const model = await getModelById(user, modelId)

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