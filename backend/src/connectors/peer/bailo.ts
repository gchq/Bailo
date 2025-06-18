import fetch, { Response } from 'node-fetch'

import { isBailoError } from '../../types/error.js'
import { SystemStatus } from '../../types/types.js'
import config from '../../utils/config.js'
import { InternalError } from '../../utils/error.js'
import { BasePeerConnector } from './base.js'

const emptyPing: SystemStatus = {
  ping: '',
}

export class BailoPeerConnector extends BasePeerConnector {
  init() {
    return Promise.resolve(true)
  }

  async getPeerStatus(): Promise<SystemStatus> {
    if (this.isDisabled()) {
      return emptyPing
    }

    try {
      return this.request<SystemStatus>('/api/v2/system/status')
    } catch (err) {
      if (isBailoError(err)) {
        return {
          error: err,
          ...emptyPing,
        }
      }
      throw err
    }
  }

  async request<T>(path: string) {
    let res: Response
    const requestUrl = this.config.baseUrl.concat(path)
    try {
      res = await fetch(requestUrl, {
        agent: this.getHttpsAgent(),
        headers: {
          'x-bailo-id': config.federation.id,
        },
      })
    } catch (err) {
      throw InternalError('Unable to communicate with peer.', {
        err,
      })
    }

    if (!res.ok) {
      const context = {
        url: res.url,
        status: res.status,
        statusText: res.statusText,
      }
      throw InternalError('Non-200 response from remote', context)
    }

    let body: T

    try {
      body = (await res.json()) as T
    } catch (err) {
      throw InternalError('Unexpected response from peer', { err })
    }

    return body
  }
}
