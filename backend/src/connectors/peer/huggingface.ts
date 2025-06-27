import { HubApiError, listModels, modelInfo } from '@huggingface/hub'

import { ModelSearchResult } from '../../routes/v2/model/getModelsSearch.js'
import { SystemStatus } from '../../types/types.js'
import { ConfigurationError } from '../../utils/error.js'
import { BasePeerConnector } from './base.js'

interface ExtraConfig {
  statusModelName: string
  statusModelId: string
}

export class HuggingFaceHubConnector extends BasePeerConnector {
  getExtraConfig(): ExtraConfig {
    const extra = this.config.extra
    if (!Object.hasOwn(extra, 'statusModelId') || !Object.hasOwn(extra, 'statusModelName')) {
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

  async queryModels(opts: { query: string }): Promise<Array<ModelSearchResult>> {
    const models = new Array<ModelSearchResult>()
    // Don't allow a whole search
    if (opts.query.length < 5) {
      return models
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
    return Promise.resolve(models)
  }
}
