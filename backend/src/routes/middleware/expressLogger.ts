import devnull from 'dev-null'
import { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'

import log from '../../services/v2/log.js'

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
        tokens.dev(morgan, req, res),
      )

      return ''
    },
    {
      skip: (req, _res) => ['/_next/', '/__nextjs'].some((val) => req.originalUrl.startsWith(val)),
      // write to nowhere...
      stream: devnull(),
    },
  ),
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
