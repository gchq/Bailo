import { UserInterface } from '../../models/User.js'
import { ModelSearchResultWithErrors, PeerConfigStatus } from '../../types/types.js'
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
    await Promise.all(Array.from(this.peers.values()).map((peer) => peer.init()))
  }

  async status(peersToQuery: Array<string> = this.peerIds): Promise<Map<string, PeerConfigStatus>> {
    if (!peersToQuery.every((q) => this.peers.has(q))) {
      throw InternalError('Invalid peer IDs provided to wrapper')
    }
    const entries = await Promise.all(
      peersToQuery.map(async (id) => {
        const peer = this.peers.get(id)!
        return [
          id,
          {
            status: await peer.getPeerStatus(),
            config: peer.getConfig(),
          } as PeerConfigStatus,
        ] as [string, PeerConfigStatus]
      }),
    )
    return new Map<string, PeerConfigStatus>(entries)
  }

  async queryModels(
    opts: {
      query: string
    },
    user: UserInterface,
    peersToQuery: Array<string> = this.peerIds,
  ): Promise<Array<ModelSearchResultWithErrors>> {
    if (!peersToQuery.every((q) => this.peers.has(q))) {
      throw InternalError('Invalid peer IDs provided to wrapper')
    }
    const results = await Promise.all(
      peersToQuery.map((id) => {
        const peer = this.peers.get(id)!
        return peer.queryModels(opts, user)
      }),
    )
    return results.flat()
  }
}
