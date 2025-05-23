import NodeCache from 'node-cache'

import { UserInterface } from '../../models/User.js'
import { ModelSearchResult } from '../../routes/v2/model/getModelsSearch.js'
import { getHttpsAgent } from '../../services/http.js'
import { FederationState, FederationStateKeys, RemoteFederationConfig, SystemStatus } from '../../types/types.js'

export abstract class BasePeerConnector {
  id: string
  config: RemoteFederationConfig
  queryCache: NodeCache | undefined

  constructor(id: string, config: RemoteFederationConfig) {
    this.id = id
    this.config = config
  }

  getQueryCache(): NodeCache | undefined {
    const queryTtl = this.config.cache?.query
    if (queryTtl && queryTtl > -1 && !this.queryCache) {
      this.queryCache = new NodeCache({ stdTTL: queryTtl })
    }
    return this.queryCache
  }

  getHttpsAgent() {
    const opts = this.config.httpConfig || {}
    let proxyOpts = {}
    if (this.getConfig().proxy) {
      proxyOpts = {
        getProxyForUrl: () => {
          return this.config.proxy
        },
      }
    }
    return getHttpsAgent({
      ...opts,
      ...proxyOpts,
    })
  }

  /**
   * The *internal* configuration ID for this peer
   */
  getId(): string {
    return this.id
  }

  /**
   * The config object for this peer
   */
  getConfig(): RemoteFederationConfig {
    return Object.freeze(this.config)
  }

  /**
   * The internal state for this peer {@see {@link FederationStateKeys}}
   */
  getConfiguredState(): FederationStateKeys {
    return this.config.state
  }

  isDisabled() {
    return FederationState.DISABLED === this.getConfiguredState()
  }

  abstract init(): Promise<boolean>

  /**
   * Fetch the peer's system status
   */
  abstract getPeerStatus(): Promise<SystemStatus>

  abstract queryModels(opts, user: UserInterface): Promise<Array<ModelSearchResult>>

  /**
   * Namespace cache by user
   *
   * @param user to extract the DN from
   * @param key to use as the remainder of the key (such as a query string)
   * @returns a user-specific cache key
   */
  buildCacheKey(user: UserInterface, key: string) {
    return `${user.dn}+${key}`
  }
}
