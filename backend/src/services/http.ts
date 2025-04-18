import http from 'node:http'
import https from 'node:https'

import { ProxyAgent } from 'proxy-agent'

import { FederationState } from '../types/types.js'
import config from '../utils/config.js'
import { InternalError } from '../utils/error.js'

// This function has the same syntax as 'https.Agent', but is centralised throughout
// the application in case it needs to be altered.
export function getHttpsAgent(config?: https.AgentOptions) {
  return new ProxyAgent({
    getProxyForUrl,
    ...config,
  })
}

async function getProxyForUrl(url: string, req: http.ClientRequest): Promise<string> {
  if (config.federation.state === FederationState.DISABLED) {
    return config.federation.defaultProxy || ''
  }

  const peerId = req.getHeader('x-bailo-peer-id')
  if (typeof peerId !== 'string') {
    throw InternalError('Unexpected peer ID found')
  }

  const peerConfig = config.federation.peers?.get(peerId)
  if (peerConfig?.proxy) {
    return peerConfig.proxy
  }

  throw new Error('Configuration not found')
}
