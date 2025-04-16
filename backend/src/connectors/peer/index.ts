import { RemoteFederationConfig } from '../../types/types.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BailoPeerConnector } from './bailo.js'

export const PeerKind = {
  Bailo: 'bailo',
} as const
export type PeerKindKeys = (typeof PeerKind)[keyof typeof PeerKind]

export function getPeerConnectorById(id: string) {
  return getPeerConnector(config.federation.peers.get(id))
}

export default function getPeerConnector(cfg: RemoteFederationConfig | undefined) {
  if (!cfg) throw Error('Peer configuration not provided')

  switch (cfg.kind) {
    case PeerKind.Bailo:
      try {
        return new BailoPeerConnector(cfg)
      } catch (_error) {
        throw ConfigurationError('Could not configure or initialise Bailo peer connector')
      }
    default:
      throw ConfigurationError(`'${cfg.kind}' not supported.`, {
        validKinds: Object.values(PeerKind),
      })
  }
}
