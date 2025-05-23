import { FederationState, RemoteFederationConfig } from '../../types/types.js'
import config from '../../utils/config.js'
import { ConfigurationError, InternalError } from '../../utils/error.js'
import { BailoPeerConnector } from './bailo.js'
import { BasePeerConnector } from './base.js'
import { HuggingFaceHubConnector } from './huggingface.js'
import { PeerConnectorWrapper } from './wrapper.js'

export const PeerKind = {
  Bailo: 'bailo',
  HuggingFaceHub: 'huggingfacehub',
} as const
export type PeerKindKeys = (typeof PeerKind)[keyof typeof PeerKind]

const peers = new Map<string, BasePeerConnector>()
let peerWrapper: undefined | PeerConnectorWrapper = undefined

function validate(cfg: RemoteFederationConfig): void {
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
    throw ConfigurationError(`Missing required configuration for peer`, {
      missingConfig: keys,
    })
  }
}

export function getPeerConnector(id: string): BasePeerConnector {
  const peer = peers.get(id)
  if (!peer) {
    throw InternalError('Peer not configured')
  }
  return peer
}

export async function getPeerConnectors(cache = true) {
  if (peerWrapper && cache) {
    return peerWrapper
  }
  // If not globally disabled, setup each peer
  if (FederationState.DISABLED !== config.federation.state) {
    for (const [id, cfg] of Object.entries(config.federation.peers)) {
      validate(cfg)
      switch (cfg.kind) {
        case PeerKind.Bailo:
          try {
            const connector = new BailoPeerConnector(id, cfg)
            peers.set(id, connector)
          } catch (error) {
            throw ConfigurationError('Could not configure or initialise Bailo connector', { error })
          }
          break
        case PeerKind.HuggingFaceHub:
          try {
            const connector = new HuggingFaceHubConnector(id, cfg)
            peers.set(id, connector)
          } catch (error) {
            throw ConfigurationError('Could not configure or initialise HuggingFace connector', { error })
          }
          break
        default:
          throw ConfigurationError(`'${cfg.kind}' is not a valid peer connector kind.`, {
            validKinds: Object.values(PeerKind),
          })
      }
    }
  }

  peerWrapper = new PeerConnectorWrapper(peers)
  await peerWrapper.init()
  return peerWrapper
}

export default await getPeerConnectors()
