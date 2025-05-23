import https from 'node:https'

import { Agent } from 'undici'

// This function has the same syntax as 'https.Agent', but is centralised throughout
// the application in case it needs to be altered.
export function getHttpsAgent(config?: https.AgentOptions) {
  return new https.Agent({ ...config })
}

export function getHttpsUndiciAgent(config?: Agent.Options) {
  return new Agent({ ...config })
}
