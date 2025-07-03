import { EntrySearchResult } from 'actions/model'
import { RemoteFederationConfig } from 'types/types'

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
