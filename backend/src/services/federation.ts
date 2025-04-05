import { BasePeerConnector } from '../connectors/peer/base.js'
import getPeerConnector from '../connectors/peer/index.js'
import peer, { getPeerIds } from '../connectors/peer/index.js'
import { FederationState, PeerConfigStatus, SystemStatus } from '../types/types.js'
import config from '../utils/config.js'
import { ConfigurationError } from '../utils/error.js'

function isGloballyDisabled() {
  return FederationState.DISABLED == config.federation.state
}

function isDisabledForPeer(connector: BasePeerConnector) {
  return FederationState.DISABLED == connector.getConfiguredState()
}

export async function getAllPeerStatus(): Promise<Map<string, PeerConfigStatus>> {
  // Early return if globally disabled
  if (isGloballyDisabled()) {
    return Promise.resolve(new Map<string, PeerConfigStatus>())
  }

  const statuses = new Map<string, PeerConfigStatus>()
  const promises: Array<Promise<PeerConfigStatus>> = []

  for (const id of getPeerIds()) {
    const promise = getPeerStatus(id)
    promise.then((peerConfigStatus) => {
      statuses.set(id, peerConfigStatus)
    })
    promises.push(promise)
  }
  await Promise.all(promises)
  return statuses
}

const disabledSystemStatus: SystemStatus = {
  ping: '',
  error: ConfigurationError('Federation is currently disabled'),
  federation: {
    state: FederationState.DISABLED,
  },
}

export async function getPeerStatus(id: string): Promise<PeerConfigStatus> {
  const connector = getPeerConnector(id)
  const config = connector.getConfig()
  let status: SystemStatus
  if (isGloballyDisabled() || isDisabledForPeer(connector)) {
    status = disabledSystemStatus
  } else {
    status = await peer(id).getPeerStatus()
  }

  return Promise.resolve({
    config,
    status,
  })
}
