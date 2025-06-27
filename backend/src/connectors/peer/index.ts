import log from '../../services/log.js'
import { FederationState, RemoteFederationConfig } from '../../types/types.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BailoPeerConnector } from './bailo.js'
import { BasePeerConnector } from './base.js'
import { PeerConnectorWrapper } from './wrapper.js'

export const PeerKind = {
  Bailo: 'bailo',
} as const
export type PeerKindKeys = (typeof PeerKind)[keyof typeof PeerKind]

const peers = new Map<string, BasePeerConnector>()
let peerWrapper: undefined | PeerConnectorWrapper = undefined

function validate(id: string, cfg: RemoteFederationConfig): void {
  if (peers.has(id)) {
    throw ConfigurationError('Duplicate ID specified in federation config', { id })
  }

  const keys = new Array<string>()

  if (!cfg.kind) {
    keys.push('kind')
  }
  if (!cfg.baseUrl) {
    keys.push('baseUrl')
  }
  if (!cfg.state) {
    keys.push('state')
  }
  if (keys.length > 0) {
    throw ConfigurationError('Missing required configuration for peer', {
      missingConfig: keys,
    })
  }
}

export default async function getPeerConnectors(cache = true): Promise<PeerConnectorWrapper> {
  if (peerWrapper && cache) {
    return peerWrapper
  }
  // If not globally disabled, setup each peer
  if (FederationState.DISABLED === config.federation.state) {
    log.debug('Federation is disabled, skipping setup of peers')
  }
  for (const [id, cfg] of Object.entries(config.federation.peers)) {
    validate(id, cfg)
    switch (cfg.kind) {
      case PeerKind.Bailo:
        try {
          // Validate carries out a duplicate ID check and basic config validation
          const connector = new BailoPeerConnector(id, cfg)
          peers.set(id, connector)
        } catch (error) {
          throw ConfigurationError('Could not configure or initialise Bailo connector', { error })
        }
        break
      default:
        throw ConfigurationError(`'${cfg.kind}' is not a valid peer connector kind.`, {
          validKinds: Object.values(PeerKind),
        })
    }
  }

  peerWrapper = new PeerConnectorWrapper(peers)
  await peerWrapper.init()
  return peerWrapper
}
