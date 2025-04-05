import { PeerConfigStatus } from '../../types/types.js'
import { InternalError } from '../../utils/error.js'
import { BasePeerConnector } from './base.js'

export class PeerConnectorWrapper {
  peers: Map<string, BasePeerConnector>
  peerIds: Array<string>

  constructor(peers: Map<string, BasePeerConnector>) {
    this.peers = peers
    this.peerIds = Array.from(peers.keys())
  }

  async init() {
    this.peers.forEach((peer) => peer.init())
  }

  async status(peersToQuery: Array<string> = this.peerIds): Promise<Map<string, PeerConfigStatus>> {
    const results = new Map<string, PeerConfigStatus>()
    const validPeers = peersToQuery.every((q) => this.peers.has(q))
    if (!validPeers) {
      throw InternalError('Invalid peer IDs provided to wrapper')
    }
    for (const id of peersToQuery) {
      const peer = this.peers.get(id)
      if (!peer) {
        throw InternalError(`Peer connector not found: ${id}`)
      }
      results.set(id, {
        status: await peer.getPeerStatus(),
        config: peer.getConfig(),
      })
    }

    return results
  }
}
