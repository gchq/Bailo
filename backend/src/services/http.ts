import { ProxyAgent, ProxyAgentOptions } from 'proxy-agent'
import { Agent, Dispatcher1Wrapper } from 'undici'

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
  const agent = new Agent({
    ...opts,
  })

  // Workaround for @types/node being wrong for undici here and throwing:
  // Type 'Agent' is not assignable to type 'Dispatcher'.
  return new Dispatcher1Wrapper(agent) as unknown as RequestInit['dispatcher']
}
