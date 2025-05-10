import { BasePeerConnector } from '../connectors/peer/base.js'
import getPeerConnector from '../connectors/peer/index.js'
import peer, { getPeerIds } from '../connectors/peer/index.js'
import { FederationState, PeerConfigStatus } from '../types/types.js'
import config from '../utils/config.js'
import { ConfigurationError, InternalError } from '../utils/error.js'

function ensureFederationNotGloballyDisabled() {
  if (FederationState.DISABLED == config.federation.state) {
    throw InternalError('Federation is globally disabled')
  }
}

function ensureFederationNotDisabled(connector: BasePeerConnector) {
  if (FederationState.DISABLED == connector.getConfiguredState()) {
    throw ConfigurationError(`Federation is currently disabled; will not fetch peer ${connector.getId()} status`)
  }
}

export async function getAllPeerStatus(): Promise<Map<string, PeerConfigStatus>> {
  ensureFederationNotGloballyDisabled()
  const peerStatus = new Map<string, PeerConfigStatus>()
  const promises: Array<Promise<any>> = []

  for (const id of getPeerIds()) {
    promises.push(
      getPeerStatus(id).then((r) => {
        peerStatus.set(id, r)
      }),
    )
  }
  await Promise.all(promises)
  return peerStatus
}

export async function getPeerStatus(id: string): Promise<PeerConfigStatus> {
  ensureFederationNotGloballyDisabled()
  const connector = getPeerConnector(id)
  ensureFederationNotDisabled(connector)

  return Promise.resolve({
    config: connector.getConfig(),
    status: await peer(id).getPeerStatus(),
  })
}
