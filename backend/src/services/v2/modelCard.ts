import authorisation, { ModelAction } from '../../connectors/v2/authorisation/index.js'
import { ModelDoc } from '../../models/v2/Model.js'
import ModelCardModel, { ModelCardDoc } from '../../models/v2/ModelCard.js'
import ModelCardRevisionModel, { ModelCardRevisionDoc } from '../../models/v2/ModelCardRevision.js'
import { UserDoc } from '../../models/v2/User.js'
import { GetModelFiltersKeys } from '../../types/v2/enums.js'
import { asyncFilter } from '../../utils/v2/array.js'
import { BadReq, Forbidden, NotFound } from '../../utils/v2/error.js'
import { canUserActionModelById } from './model.js'
import { findSchemaById } from './schema.js'

export async function searchModels(
  user: UserDoc,
  libraries: Array<string>,
  filters: Array<GetModelFiltersKeys>,
  search: string,
  task?: string
): Promise<Array<ModelCardDoc & { model: ModelDoc }>> {
  const query: any = {}

  if (libraries.length) {
    query['metadata.highLevelDetails.tags'] = { $all: libraries }
  }

  if (task) {
    if (query['metadata.highLevelDetails.tags']) {
      query['metadata.highLevelDetails.tags'].$all.push(task)
    } else {
      query['metadata.highLevelDetails.tags'] = { $all: [task] }
    }
  }

  if (search) {
    query.$text = { $search: search }
  }

  for (const filter of filters) {
    // This switch statement is here to ensure we always handle all filters in the 'GetModelFilterKeys'
    // enum.  Eslint will throw an error if we are not exhaustiviely matching all the enum options,
    // which makes it far harder to forget.
    // At the moment it does not do anything, as we already have TypeScript checking to ensure there
    // are no unexpected filters.
    switch (filter) {
      case 'mine':
        // Handled below
        break
      default:
        throw BadReq('Unexpected filter', { filter })
    }
  }

  const results = ModelCardModel.aggregate()
    // Find only matching documents
    .match(query)
    // Sort by last updated
    .sort({ updatedAt: -1 })
    // Populate model entries
    .lookup({ from: 'v2_models', localField: 'modelId', foreignField: 'id', as: 'model' })
    // Populate model as value instead of array
    .append({ $set: { model: { $arrayElemAt: ['$model', 0] } } })

  if (filters.includes('mine')) {
    results.match({
      'model.collaborators': {
        $elemMatch: {
          entity: { $in: await authorisation.getEntities(user) },
        },
      },
    })
  }

  return asyncFilter(await results, (result) => authorisation.userModelAction(user, result.model, ModelAction.View))
}

export async function getModelCard(user: UserDoc, modelId: string) {
  const modelCard = await ModelCardModel.findOne({ modelId })

  if (!modelCard) {
    throw NotFound(`The requested model card has no models.`, { modelId })
  }

  if (!(await canUserActionModelById(user, modelCard.modelId, ModelAction.View))) {
    throw Forbidden(`You do not have permission to get this model card.`, { userDn: user.dn, modelId })
  }

  return modelCard
}

export async function getModelCardLatestRevision(user: UserDoc, modelId: string) {
  const modelCard = await ModelCardRevisionModel.findOne({ modelId }, null, { sort: { version: -1 } })

  if (!modelCard) {
    throw NotFound(`The requested model card has no models.`, { modelId })
  }

  if (!(await canUserActionModelById(user, modelCard.modelId, ModelAction.View))) {
    throw Forbidden(`You do not have permission to get this model card.`, { userDn: user.dn, modelId })
  }

  return modelCard
}

export async function doesModelCardExist(user: UserDoc, modelId: string) {
  const modelCard = await ModelCardRevisionModel.findOne({ modelId })

  return modelCard !== undefined
}

export async function getModelCardRevision(user: UserDoc, modelId: string, version: number) {
  const modelCard = await ModelCardRevisionModel.findOne({ modelId, version })

  if (!modelCard) {
    throw NotFound(`Version '${version}' does not exist on the requested model`, { modelId, version })
  }

  if (!(await canUserActionModelById(user, modelCard.modelId, ModelAction.View))) {
    throw Forbidden(`You do not have permission to get this model card.`, { userDn: user.dn, modelId })
  }

  return modelCard
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
  metadata: unknown
) {
  // This function could cause a race case in the 'ModelCardRevision' model.  This
  // is prevented by ensuring there is a compound index on 'modelId' and 'version'.
  //
  // In the event that a race case occurs, the database will throw an error mentioning
  // that there is a duplicate item already found.  This prevents any requirement for
  // a lock on the collection that would likely be a significant slowdown to the query.
  //
  // It is assumed that this race case will occur infrequently.

  if (!(await canUserActionModelById(user, modelId, ModelAction.Write))) {
    throw Forbidden(`You do not have permission to update this model card.`, { userDn: user.dn, modelId })
  }

  // We don't want to copy across other values
  const newDocument = {
    modelId: modelId,
    schemaId: schemaId,

    version,
    metadata,
  }

  const revision = new ModelCardRevisionModel({ ...newDocument, createdBy: user.dn })
  await revision.save()

  await ModelCardModel.updateOne({ modelId }, newDocument)

  return revision
}

export async function updateModelCard(
  user: UserDoc,
  modelId: string,
  metadata: unknown
): Promise<ModelCardRevisionDoc> {
  const currentCard = await getModelCardLatestRevision(user, modelId)

  // `currentCard` is a 'ModelCardRevisionDoc', but that's assignable to a 'ModelCardDoc'.
  if (!(await canUserActionModelById(user, currentCard.modelId, ModelAction.Write))) {
    throw Forbidden(`You do not have permission to update this model card.`, { userDn: user.dn, modelId })
  }

  const revision = await _setModelCard(user, modelId, currentCard.schemaId, currentCard.version + 1, metadata)
  return revision
}

export async function createModelCardFromSchema(
  user: UserDoc,
  modelId: string,
  schemaId: string
): Promise<ModelCardDoc> {
  if (!(await canUserActionModelById(user, modelId, ModelAction.Write))) {
    throw Forbidden(`You do not have permission to update this model card.`, { userDn: user.dn, modelId })
  }

  if (await doesModelCardExist(user, modelId)) {
    throw BadReq('This model already has an initial model card.', { modelId })
  }

  // Ensure schema exists
  await findSchemaById(schemaId)

  const revision = await _setModelCard(user, modelId, schemaId, 1, {})
  return revision
}
