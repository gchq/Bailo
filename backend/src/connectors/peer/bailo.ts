import fetch, { Response } from 'node-fetch'

import { UserInterface } from '../../models/User.js'
import { isBailoError } from '../../types/error.js'
import { EntrySearchOptionsParams, EntrySearchResultWithErrors, SystemStatus } from '../../types/types.js'
import config from '../../utils/config.js'
import { GenericError, InternalError } from '../../utils/error.js'
import { BasePeerConnector } from './base.js'

const emptyPing: SystemStatus = {
  ping: '',
}

export class BailoPeerConnector extends BasePeerConnector {
  init() {
    return Promise.resolve(true)
  }

  async searchEntries(_user: UserInterface, opts: EntrySearchOptionsParams): Promise<EntrySearchResultWithErrors> {
    let query: URLSearchParams = new URLSearchParams()
    if (opts.search) {
      query = new URLSearchParams({ search: opts.search })
    }

    const results = await this.request<EntrySearchResultWithErrors>(`/api/v2/models/search?${query.toString()}`)

    return {
      models: results.models.map((model) => ({
        ...model,
        peerId: this.getId(),
      })),
      errors: results.errors,
    }
  }

  async getPeerStatus(): Promise<SystemStatus> {
    if (this.isDisabled()) {
      return emptyPing
    }

    return this.request<SystemStatus>('/api/v2/system/status').catch((err) => {
      if (isBailoError(err)) {
        return {
          error: err,
          ...emptyPing,
        }
      } else if (err instanceof Error) {
        return {
          error: InternalError(err.message, { err }),
          ...emptyPing,
        }
      } else {
        return {
          error: GenericError(500, String(err), { cause: err }),
          ...emptyPing,
        }
      }
    })
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
