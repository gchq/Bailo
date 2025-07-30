import { getHttpsAgent } from '../../services/http.js'
import { FederationState, FederationStateKeys, RemoteFederationConfig, SystemStatus } from '../../types/types.js'

export abstract class BasePeerConnector {
  id: string
  config: RemoteFederationConfig
  constructor(id: string, config: RemoteFederationConfig) {
    this.id = id
    this.config = config
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
}
