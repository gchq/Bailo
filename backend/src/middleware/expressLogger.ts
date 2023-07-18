import devnull from 'dev-null'
import { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'

import log from '../services/v2/log.js'
import { BailoError } from '../types/v2/error.js'

const morganLog = promisify(
  morgan<any, any>(
    (tokens, req, res) => {
      req.log.trace(
        {
          url: tokens.url(req, res),
          method: tokens.method(req, res),
          'response-time': tokens['response-time'](req, res),
          status: tokens.status(req, res),
          code: 'approval',
        },
        tokens.dev(morgan, req, res)
      )

      return ''
    },
    {
      skip: (req, _res) => ['/_next/', '/__nextjs'].some((val) => req.originalUrl.startsWith(val)),
      // write to nowhere...
      stream: devnull(),
    }
  )
)

export async function expressLogger(req: Request, res: Response, next: NextFunction) {
  req.reqId = (req.headers['x-request-id'] as string) || uuidv4()
  req.log = log.child({
    id: req.reqId,
    user: req.user?.id,
    clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  })

  res.setHeader('x-request-id', req.reqId)

  await morganLog(req, res)
  next()
}

function bailoErrorGuard(err: unknown): err is BailoError {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  if (!('code' in err) || typeof err.code !== 'number') {
    return false
  }

  if (err.code < 100 || err.code >= 600) {
    return false
  }

  // Internal and context are both unknown, so they could be any value.
  // Thus, we don't check them here.

  return true
}

export async function expressErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (!bailoErrorGuard(err)) {
    log.error({ err }, 'No error code was found, returning generic error to user.')
    throw err
  }

  const logger = err.logger || req.log
  logger.warn(err.context, err.message)

  return res.status(err.code).json({
    error: {
      name: err.name,
      message: err.message,
      context: err.context,
    },
  })
}
