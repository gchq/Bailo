import fetch from 'node-fetch'

import log from '../../services/log.js'
import { RemoteFederationConfig, SystemStatus } from '../../types/types.js'
import { BasePeerConnector } from './base.js'

export class BailoPeerConnector extends BasePeerConnector {
  config: RemoteFederationConfig
  constructor(config: RemoteFederationConfig) {
    super()
    this.config = config
  }

  async ping(): Promise<SystemStatus> {
    return this.request<SystemStatus>('/api/v2/system/status')
  }

  async request<T>(path: string) {
    let res
    const requestUrl = this.config.baseUrl.concat(path)
    try {
      res = await fetch(requestUrl)
    } catch (_err) {
      throw Error('Unable to communicate with peer.')
    }
    const body = (await res.json()) as T
    if (!res.ok) {
      const context = {
        url: res.url,
        status: res.status,
        statusText: res.statusText,
      }
      log.error(JSON.stringify(context))
      throw Error('Unrecognised response returned by the peer.')
    }

    return body
  }
}
