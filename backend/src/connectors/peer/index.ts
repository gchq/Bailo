import { RemoteFederationConfig } from '../../types/types.js'
import config from '../../utils/config.js'
import { ConfigurationError, InternalError } from '../../utils/error.js'
import { BailoPeerConnector } from './bailo.js'
import { BasePeerConnector } from './base.js'

export const PeerKind = {
  Bailo: 'bailo',
} as const
export type PeerKindKeys = (typeof PeerKind)[keyof typeof PeerKind]

let peersConfigured = false
const peerIds = new Array<string>()
const peers = new Map<string, BasePeerConnector>()

function setupPeers(): void {
  if (peersConfigured) return
  for (const [id, cfg] of Object.entries(config.federation.peers)) {
    peers.set(id, configurePeerConnector(id, cfg))
    peerIds.push(id)
  }
  peersConfigured = true
}

function configurePeerConnector(id: string, cfg: RemoteFederationConfig) {
  switch (cfg.kind) {
    case PeerKind.Bailo:
      try {
        return new BailoPeerConnector(id, cfg)
      } catch (error) {
        throw ConfigurationError('Could not configure or initialise Bailo peer connector', {
          error,
        })
      }
    default:
      throw ConfigurationError(`'${cfg.kind}' not supported.`, {
        validKinds: Object.values(PeerKind),
      })
  }
}

export function getPeerIds(): Array<string> {
  if (!peersConfigured) setupPeers()
  return peerIds
}

export function getPeerConnectors(): Map<string, BasePeerConnector> {
  if (!peersConfigured) setupPeers()
  return peers
}

export default function getPeerConnector(id: string): BasePeerConnector {
  if (!peersConfigured) setupPeers()
  const peer = peers.get(id)
  if (!peer) throw InternalError('Peer not configured')
  return peer
}
