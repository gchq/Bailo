import peer from '../connectors/peer/index.js'
import { FederationState, PeerConfigStatus, RemoteFederationConfig } from '../types/types.js'
import config from '../utils/config.js'
import { InternalError } from '../utils/error.js'

function ensureFederationIsNotDisabled() {
  if (FederationState.DISABLED == config.federation.state) {
    throw InternalError('Federation is globally disabled')
  }
}

export async function getAllPeerStatus(): Promise<Map<string, PeerConfigStatus>> {
  ensureFederationIsNotDisabled()
  const peers = new Map(Object.entries(config.federation.peers))
  if (peers && peers.size > 0) {
    const peerStatus = new Map<string, PeerConfigStatus>()
    const promises: Array<Promise<any>> = []
    for (const [id, cfg] of peers) {
      promises.push(
        getPeerStatus(cfg).then((r) => {
          peerStatus.set(id, r)
        }),
      )
    }
    await Promise.all(promises)
    return peerStatus
  } else {
    return Promise.resolve(new Map<string, PeerConfigStatus>())
  }
}

async function getPeerStatus(config: RemoteFederationConfig): Promise<PeerConfigStatus> {
  return Promise.resolve({
    config,
    status: await peer(config).ping(),
  })
}

export async function getPeerStatusById(id: string): Promise<PeerConfigStatus> {
  ensureFederationIsNotDisabled()
  const peerCfg = config.federation.peers.get(id)

  if (peerCfg === undefined) {
    throw Error(`No configuration found for ${id}`)
  }

  if (FederationState.DISABLED == peerCfg.state) {
    throw Error(`Federation is currently disabled; will not fetch peer ${id} status`)
  }

  return getPeerStatus(peerCfg)
}
