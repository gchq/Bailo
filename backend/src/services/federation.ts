import { FederationState, PeerConfigStatus, RemoteFederationConfig } from '../types/types.js'
import config from '../utils/config.js'
import log from './log.js'

function ensureFederationIsNotDisabled() {
  if (FederationState.DISABLED == config.federation.state) {
    throw Error('Federation is globally disabled')
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
  // call remote with config
  log.debug(`Placeholder remote call to ${config.baseUrl}`)

  return Promise.resolve({
    config,
    status: {
      code: 200,
      ping: 'pong',
      federation: {
        id: 'remote',
        state: 'enabled',
      },
    },
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
