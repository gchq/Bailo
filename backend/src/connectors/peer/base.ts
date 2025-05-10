import { FederationStateKeys, RemoteFederationConfig, SystemStatus } from '../../types/types.js'

export abstract class BasePeerConnector {
  /**
   * The *internal* configuration ID for this peer
   */
  abstract getId(): string
  /**
   * The config object for this peer
   */
  abstract getConfig(): RemoteFederationConfig
  /**
   * The internal state for this peer {@see {@link FederationStateKeys}}
   */
  abstract getConfiguredState(): FederationStateKeys
  /**
   * Fetch the peer's system status
   */
  abstract getPeerStatus(): Promise<SystemStatus>
}
