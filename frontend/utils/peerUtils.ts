import { EntrySearchResult } from 'actions/model'
import { PeerConfigStatus, RemoteFederationConfig } from 'types/types'

/**
 * Generates an absolute URL to a given entry
 *
 * @param peer to get peer kind and other configuration from
 * @param entry to use to generate the link
 * @returns an absolute URL to the entry
 */
export function getEntryUrl(peer: RemoteFederationConfig, entry: EntrySearchResult) {
  const baseUrl = peer.baseUrl
  switch (peer.kind) {
    // HuggingFace.co by default
    case 'huggingfacehub':
      if ('data-card' == entry.kind) {
        return `${baseUrl}/datasets/${entry.name}`
      }
      // Model uses the base path
      return `${baseUrl}/${entry.name}`

    // Peer Bailo instances
    case 'bailo':
    default:
      return `${baseUrl}/${entry.kind}/${entry.id}`
  }
}

/**
 * Given a peer's configuration status, is it reachable?
 *
 * @param peer to check
 * @returns true if enabled/readOnly and successfully pinged
 */
export function isReachable(peer: PeerConfigStatus): boolean {
  return peer.config.state !== 'disabled' && !peer.status.error && peer.status.ping === 'pong'
}
