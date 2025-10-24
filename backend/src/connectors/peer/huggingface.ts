import { HubApiError, listModels, modelInfo } from '@huggingface/hub'

import { UserInterface } from '../../models/User.js'
import log from '../../services/log.js'
import { ModelSearchResult, ModelSearchResultWithErrors, SystemStatus } from '../../types/types.js'
import { BadReq, ConfigurationError } from '../../utils/error.js'
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

  async queryModels(opts: { query: string }, user: UserInterface): Promise<ModelSearchResultWithErrors> {
    const cache = this.getQueryCache()
    const cacheKey = this.buildCacheKey(user, opts.query)
    const cacheResult = cache ? cache.get<Array<ModelSearchResult>>(cacheKey) : undefined
    if (cacheResult) {
      log.debug(`Cache hit - returning cached result for ${cacheKey}`)
      return {
        models: cacheResult,
      }
    }
    log.debug(`Cache miss - executing query for ${cacheKey}`)

    // No cache result - execute query, cache response if appropriate
    const models = new Array<ModelSearchResult>()
    // Require a minimum length for search
    const minLength = 5
    if (opts.query.length < minLength) {
      return {
        models: [],
        errors: {
          [this.getId()]: BadReq('Query too short', { query: opts.query, minLength }),
        },
      }
    }

    for await (const model of listModels({
      search: { query: opts.query },
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
