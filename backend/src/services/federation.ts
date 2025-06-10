import peers from '../connectors/peer/index.js'
import { PeerConfigStatus } from '../types/types.js'

export async function getAllPeerStatus(): Promise<Map<string, PeerConfigStatus>> {
  return (await peers()).status()
}
