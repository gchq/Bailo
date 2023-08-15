import authorisation, { ModelAction } from '../../connectors/v2/authorisation/index.js'
import { ModelDoc } from '../../models/v2/Model.js'
import ModelCardModel, { ModelCardDoc } from '../../models/v2/ModelCard.js'
import { UserDoc } from '../../models/v2/User.js'
import { GetModelFiltersKeys } from '../../routes/v2/model/getModels.js'
import { asyncFilter } from '../../utils/v2/array.js'
import { BadReq } from '../../utils/v2/error.js'

export async function searchModels(
  user: UserDoc,
  libraries: Array<string>,
  filters: Array<GetModelFiltersKeys>,
  search: string,
  task?: string
) {
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
          entity: '', // TODO...
        },
      },
    })
  }

  return asyncFilter(await results, (result) => authorisation.userModelAction(user, result.model, ModelAction.View))
}
