import { getPeerConnectors } from '../connectors/peer/index.js'
import { PeerConfigStatus } from '../types/types.js'

export async function getAllPeerStatus(): Promise<Map<string, PeerConfigStatus>> {
  const wrapper = await getPeerConnectors()
  return wrapper.status()
}
