import type { ConnectionOptions } from 'node:tls'

import { Agent, EnvHttpProxyAgent, ProxyAgent as UndiciProxyAgent } from 'undici'

import config from '../utils/config.js'
import { ConfigurationError } from '../utils/error.js'

// Pull in default options once
const defaultOpts = config.httpClient?.defaultOpts || {}

export function getHttpsUndiciAgent(opts?: Agent.Options) {
  return new Agent(opts)
}

export type HttpsDispatcherOptions = Pick<ConnectionOptions, 'rejectUnauthorized' | 'ca' | 'cert' | 'key'> & {
  /** `http(s)://` proxy URL. When omitted, `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` are used. */
  proxy?: string
}

export function getHttpsDispatcher(opts: HttpsDispatcherOptions = {}) {
  const { proxy, ...overrides } = opts
  const tls = { ...defaultOpts, ...overrides }

  if (!proxy) {
    // `connect` applies to direct requests and `requestTls` to requests sent through an environment proxy
    return new EnvHttpProxyAgent({ connect: tls, requestTls: tls } as EnvHttpProxyAgent.Options)
  }

  const proxyProtocol = URL.parse(proxy)?.protocol
  if (proxyProtocol !== 'http:' && proxyProtocol !== 'https:') {
    throw ConfigurationError('Only http:// and https:// proxy URLs are supported.', { proxy })
  }
  return new UndiciProxyAgent({ uri: proxy, requestTls: tls })
}
