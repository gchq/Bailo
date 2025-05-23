import http from 'node:http'
import https from 'node:https'

import { ProxyAgent } from 'proxy-agent'

import getPeerConnector from '../connectors/peer/index.js'
import config from '../utils/config.js'
import { InternalError } from '../utils/error.js'
import log from './log.js'

const defaultOpts = config.httpClient?.defaultOpts

// This function has the same syntax as 'https.Agent', but is centralised throughout
// the application in case it needs to be altered.
export function getHttpsAgent(opts?: https.AgentOptions) {
  return new ProxyAgent({
    getProxyForUrl,
    ...(defaultOpts && { defaultOpts }),
    ...(opts && { opts }),
  })
}

export const remotePeerIdHeader = 'x-bailo-remote-id'

/**
 * Internal callback to support different proxy configurations for each remote peer
 * @param url of the request
 * @param req that contains a header referencing the peer ID
 * @returns empty string if no proxy should be used, or the configured proxy for the request
 */
function getProxyForUrl(url: string, req: http.ClientRequest): string {
  // Use global proxy by default, if configured
  let proxy = config.httpClient.proxy || ''

  // If calling out to a remote peer, look for explicit config
  if (req.hasHeader(remotePeerIdHeader)) {
    const peerId = req.getHeader(remotePeerIdHeader)
    if (typeof peerId !== 'string') {
      throw InternalError('Unexpected remote peer ID found')
    }
    log.trace(`Proxy callback for remote peer ID ${peerId}`)
    const peerConfig = getPeerConnector(peerId).getConfig()
    // Use explicit config if available, otherwise default proxy for all federation, otherwise 'global' proxy
    proxy = peerConfig.proxy || config.federation.defaultProxy || proxy
  }

  // Check if we should be using no proxy for this URL
  const hostname = new URL(url).hostname
  if (config.httpClient.noProxy.includes(hostname)) {
    proxy = ''
    log.trace(`Not using a proxy for ${hostname}`)
  } else {
    log.trace(`Using ${proxy} for ${url}`)
  }
  return proxy
}
