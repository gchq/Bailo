import { ProxyAgent, ProxyAgentOptions } from 'proxy-agent'

import config from '../utils/config.js'

// Pull in default options once
const defaultOpts = config.httpClient?.defaultOpts || {}

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
    ...defaultOpts,
    ...(opts || {}),
  })
}
