import https from 'node:https'

// This function has the same syntax as 'https.Agent', but is centralised throughout
// the application in case it needs to be altered.
let httpsAgent: https.Agent | undefined
export function getHttpsAgent(config?: https.AgentOptions) {
  if (!httpsAgent) {
    httpsAgent = new https.Agent({ ...config })
  }

  return httpsAgent
}
