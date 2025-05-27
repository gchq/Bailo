import { ProxyAgent, ProxyAgentOptions } from 'proxy-agent'

import config from '../utils/config.js'

/**
 * Common HTTPS agent for use throughout the application.
 *
 * By default, ProxyAgent will use environment-defined proxy configuration
 *
 * @param opts compatible with node's HTTPS Agent or the ProxyAgent
 * @returns a configured HTTPS agent
 */
export function getHttpsAgent(opts?: ProxyAgentOptions) {
  return new ProxyAgent({
    ...(config.httpClient.defaultOpts && { ...config.httpClient.defaultOpts }),
    ...(opts && { opts }),
  })
}
