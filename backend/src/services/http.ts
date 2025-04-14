import http from 'node:http'
import https from 'node:https'

import { ProxyAgent } from 'proxy-agent'

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

function getProxyForUrl(url: string, req: http.ClientRequest): Promise<string> {
  let peerId = req.getHeader('x-bailo-peer-id')
  if (!peerId) {
    const fmt = new URL(url)
    const baseUrl = fmt.protocol + '://' + fmt.host
    config.federation.peers.forEach((p) => p.baseUrl == baseUrl)
    for (const [id, value] of config.federation.peers) {
      if (baseUrl == value.baseUrl) {
        peerId = id
        break
      }
    }
  }
  if (typeof peerId !== 'string') {
    throw InternalError('Unexpected peer ID found')
  }
  let proxy = config.federation.defaultProxy
  const fedCfg = config.federation.peers.get(peerId)
  if (!fedCfg) {
    throw Error('Configuration not found')
  }
  if (fedCfg.proxy) {
    proxy = fedCfg.proxy
  }

  return Promise.resolve(proxy)
}
