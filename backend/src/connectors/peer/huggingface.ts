import { HubApiError, listModels, modelInfo } from '@huggingface/hub'

import { EntryVisibility } from '../../models/Model.js'
import { UserInterface } from '../../models/User.js'
import log from '../../services/log.js'
import {
  EntrySearchOptionsParams,
  EntrySearchResult,
  EntrySearchResultWithErrors,
  SystemStatus,
} from '../../types/types.js'
import { BadReq, ConfigurationError, NotImplemented } from '../../utils/error.js'
import { BasePeerConnector } from './base.js'

interface ExtraConfig {
  statusModelName: string
  statusModelId: string
}

export class HuggingFaceHubConnector extends BasePeerConnector {
  getExtraConfig(): ExtraConfig {
    const extra = this.config.extra
    if (!extra || !Object.hasOwn(extra, 'statusModelId') || !Object.hasOwn(extra, 'statusModelName')) {
      throw ConfigurationError(`Missing configuration for HuggingFaceHub ${this.id}`)
    }
    return this.config.extra as ExtraConfig
  }

  init(): Promise<boolean> {
    this.getExtraConfig()
    return Promise.resolve(true)
  }

  async getPeerStatus(): Promise<SystemStatus> {
    try {
      // There isn't a general 'status' endpoint, so check a 'known' model
      const name = this.getExtraConfig().statusModelName
      const modelId = this.getExtraConfig().statusModelId
      const model = await modelInfo({ name })
      if (model.id !== modelId) {
        return {
          ping: 'pong',
          error: {
            status: 500,
            code: 500,
            name: 'HuggingFaceHub API error',
            message: 'Unexpected ID returned when checking known model on HuggingFaceHub',
            context: { model },
          },
        }
      }
    } catch (error) {
      if (error instanceof HubApiError) {
        return {
          ping: '',
          error: {
            ...error,
            status: error.statusCode,
            code: error.statusCode,
          },
        }
      }
    }

    return {
      ping: 'pong',
    }
  }

  async searchEntries(user: UserInterface, opts: EntrySearchOptionsParams): Promise<EntrySearchResultWithErrors> {
    const cache = this.getQueryCache()
    const defaultKey = Object.values(opts).join('+')
    const cacheKey = this.buildCacheKey(user, defaultKey)
    const cacheResult = cache ? cache.get<Array<EntrySearchResult>>(cacheKey) : undefined
    if (cacheResult) {
      log.debug(`Cache hit - returning cached result for ${cacheKey}`)
      return {
        models: cacheResult,
      }
    }
    log.debug(`Cache miss - executing query for ${cacheKey}`)

    // No cache result - execute query, cache response if appropriate
    const models = new Array<EntrySearchResult>()

    if (opts.search && opts.search.length === 0) {
      return Promise.resolve({ models: [] })
    }

    // Only supports searching for models, not data cards etc.
    if (opts.kind && opts.kind != 'model') {
      return {
        models: [],
        errors: {
          [this.getId()]: NotImplemented(`HuggingFace does not support ${opts.kind}`, {
            query: opts.search,
            kind: opts.kind,
          }),
        },
      }
    }

    if (
      opts.allowTemplating ||
      opts.filters ||
      opts.libraries ||
      opts.organisations ||
      opts.schemaId ||
      opts.states ||
      opts.task
    ) {
      return {
        models: [],
        errors: {
          [this.getId()]: NotImplemented(`HuggingFace does not support all query parameters`, {
            searchOptions: opts,
            supportedOptions: ['search'],
          }),
        },
      }
    }
    // Require a minimum length for search
    const minLength = 5
    if (opts.search && opts.search.length < minLength) {
      return {
        models: [],
        errors: {
          [this.getId()]: BadReq('Query too short', { query: opts.search, minLength }),
        },
      }
    }

    for await (const model of listModels({
      search: { query: opts.search },
      limit: 100,
      additionalFields: ['tags', 'cardData', 'createdAt', 'author'],
    })) {
      models.push({
        id: model.id,
        name: model.name,
        description: model.task || '',
        tags: model.tags || [],
        kind: 'model',
        organisation: model.author,
        createdAt: new Date(model.createdAt),
        updatedAt: model.updatedAt,
        peerId: this.getId(),
        collaborators: [],
        sourceModelId: undefined,
        visibility: model.private ? EntryVisibility.Private : EntryVisibility.Public,
      })
    }

    // Store in cache if configured to
    if (cache) {
      log.debug(`Cache store - storing query for ${cacheKey}`)
      cache.set(cacheKey, models)
    }
    return Promise.resolve({ models })
  }
}
