import { NextFunction, Request, Response } from 'express'
import { omit } from 'lodash-es'
import fetch from 'node-fetch'
import qs from 'qs'

import { getUserById } from '../services/user.js'
import config from './config.js'
import { BadReq, Unauthorised } from './result.js'

export default function federate() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!config.ui.federation.enabled) {
      return next()
    }

    const { instance } = req.query

    const origin = req.get('X-Originating-Server')
    if (origin) {
      const remote = config.ui.federation.remotes.find((remote) => remote.id === origin)

      if (!remote) {
        throw BadReq({ origin }, 'Provided invalid originating server')
      }

      // VERIFY ORIGINATING SERVER HERE...
      const onBehalfOf = req.get('X-On-Behalf-Of')

      if (onBehalfOf) {
        req.user = await getUserById(onBehalfOf)

        if (!req.user) {
          throw Unauthorised({ onBehalfOf }, 'User does not exist on recipient server.')
        }
      }
    }

    if (!instance) {
      return next()
    }

    if (typeof instance !== 'string') {
      throw BadReq({ instance }, 'Provided invalid type to instance parameter')
    }

    if (instance === config.ui.federation.local.id) {
      return next()
    }

    const remote = config.ui.federation.remotes.find((remote) => remote.id === instance)

    if (!remote) {
      throw BadReq({ instance }, 'Provided invalid value to instance parameter')
    }

    const url = `${remote.host}${req.path}?${qs.stringify(omit(req.query, ['userId', 'email']))}`
    const response = await fetch(url, {
      headers: {
        'X-On-Behalf-Of': req.user.id,
        'X-Originating-Server': config.ui.federation.local.id,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        ...{ instance },
        ...(data as any),
      })
    }

    return res.json({
      ...{ instance },
      ...(data as any),
    })
  }
}
