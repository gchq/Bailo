import { ProxyAgent, ProxyAgentOptions } from 'proxy-agent'
import { Agent } from 'undici'

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

export function getHttpsUndiciAgent(opts?: Agent.Options) {
  // Workaround for @types/node being wrong for undici here and throwing:
  // Type 'Agent' is not assignable to type 'Dispatcher'.
  return new Agent({ ...opts }) as unknown as RequestInit['dispatcher']
}
