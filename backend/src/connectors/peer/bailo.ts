import fetch, { Response } from 'node-fetch'

import { UserInterface } from '../../models/User.js'
import { BAILO_ID_HEADER, USER_HEADER } from '../../routes/middleware/userEscalation.js'
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

  async searchEntries(user: UserInterface, opts: EntrySearchOptionsParams): Promise<EntrySearchResultWithErrors> {
    const query: URLSearchParams = new URLSearchParams()
    if (opts.search) {
      query.append('search', opts.search)
    }
    if (opts.kind) {
      query.append('kind', opts.kind)
    }
    if (opts.organisations?.length) {
      opts.organisations.forEach((organisation) => query.append('organisations', organisation))
    }
    if (opts.states?.length) {
      opts.states.forEach((state) => query.append('states', state))
    }
    if (opts.libraries?.length) {
      opts.libraries.forEach((library) => query.append('libraries', library))
    }
    if (opts.filters?.length) {
      opts.filters.forEach((filter) => query.append('filters', filter))
    }

    const results = await this.request<EntrySearchResultWithErrors>(`/api/v2/models/search?${query.toString()}`, user)

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

  async request<T>(path: string, user?: UserInterface) {
    let res: Response
    const requestUrl = this.config.baseUrl.concat(path)

    const headers = new Headers({
      [BAILO_ID_HEADER]: config.federation.id,
    })

    // If user is provided and escalation is enabled then add the user header
    if (user && user.dn !== '' && config.federation.isEscalationEnabled) {
      // headers.set(USER_HEADER, user.dn)
      headers.set(USER_HEADER, 'mr bob the app user')
    }

    try {
      res = await fetch(requestUrl, {
        agent: this.getHttpsAgent(),
        headers,
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
