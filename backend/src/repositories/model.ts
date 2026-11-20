import { type ProjectionType, type QueryFilter } from 'mongoose'

import ModelModel, {
  type EntryKindKeys,
  type EntryVisibilityKeys,
  type ModelDoc,
  type ModelInterface,
} from '../models/Model.js'
import { FUZZY_MATCH_THRESHOLD, gramSimilarity, toSearchGrams } from '../utils/search.js'

export interface SearchModelsParams {
  kind?: EntryKindKeys[]
  organisations?: string[]
  states?: string[]
  libraries?: string[]
  task?: string
  schemaId?: string
  allowTemplating?: boolean
  visibility?: EntryVisibilityKeys
  /** Entities that must all be collaborators on the entry. */
  collaboratorEntities?: string[]
  /** At least one of the entities must be a collaborator, optionally holding one of the roles. */
  collaboratorMatch?: { entities: string[]; roles?: string[] }
  search?: string
}

const searchProjection: ProjectionType<ModelDoc> = {
  settings: false,
  card: false,
  deleted: false,
  _id: false,
  __v: false,
  deletedBy: false,
  deletedAt: false,
}

function buildModelsQuery(params: SearchModelsParams): QueryFilter<ModelInterface> {
  const query: QueryFilter<ModelInterface> = {}

  if (params.kind?.length) {
    query.kind = { $in: params.kind }
  }

  if (params.organisations?.length) {
    query.organisation = { $in: params.organisations }
  }

  if (params.states?.length) {
    query.state = { $in: params.states }
  }

  const tags = [...(params.libraries ?? []), ...(params.task ? [params.task] : [])]
  if (tags.length) {
    query.tags = { $all: tags }
  }

  if (params.schemaId) {
    query['card.schemaId'] = { $all: [params.schemaId] }
  }

  if (params.allowTemplating) {
    query['settings.allowTemplating'] = true
  }

  if (params.visibility) {
    query.visibility = params.visibility
  }

  if (params.collaboratorEntities?.length) {
    query['collaborators.entity'] = { $all: params.collaboratorEntities }
  }

  if (params.collaboratorMatch) {
    query.collaborators = {
      $elemMatch: {
        ...(params.collaboratorMatch.roles?.length && {
          roles: { $elemMatch: { $in: params.collaboratorMatch.roles } },
        }),
        entity: { $in: params.collaboratorMatch.entities },
      },
    }
  }

  return query
}

/**
 * Finds entries matching the filters. A search term is matched in two ways:
 *  - fuzzy: trigram similarity over name, description and tags, so typos and part-words match, ranked best first
 *  - stemmed: the full text index, which also covers card contents, appended after the fuzzy matches
 * Without a search term, results are ordered by most recently updated.
 */
export async function findModels(params: SearchModelsParams): Promise<ModelDoc[]> {
  const query = buildModelsQuery(params)
  const queryGrams = params.search ? toSearchGrams(params.search) : []

  let results = await ModelModel.find<ModelDoc>(
    queryGrams.length ? { ...query, searchGrams: { $in: queryGrams } } : query,
    searchProjection,
  ).sort({ updatedAt: -1 })

  if (queryGrams.length) {
    // The sort is stable, so equally similar entries stay in updatedAt order
    results = results
      .map((model) => ({
        model,
        score: gramSimilarity(queryGrams, toSearchGrams(model.name, model.description, ...(model.tags ?? []))),
      }))
      .filter(({ score }) => score >= FUZZY_MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .map(({ model }) => model)
  }

  if (params.search) {
    const fullTextResults = await ModelModel.find<ModelDoc>(
      { ...query, $text: { $search: params.search } },
      searchProjection,
    ).sort({ score: { $meta: 'textScore' } })

    const alreadyFound = new Set(results.map((model) => model.id))
    results = results.concat(fullTextResults.filter((model) => !alreadyFound.has(model.id)))
  }

  return results
}
