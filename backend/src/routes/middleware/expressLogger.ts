import devnull from 'dev-null'
import { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import { promisify } from 'util'

import log from '../../services/log.js'

const morganLog = promisify(
  morgan<any, any>(
    (tokens, req, res) => {
      const info = {
        url: tokens.url(req, res),
        method: tokens.method(req, res),
        'response-time': tokens['response-time'](req, res),
        status: tokens.status(req, res),
        user: req.user,
        ...(tokens.res(req, res, 'content-length') && { 'content-length': tokens.res(req, res, 'content-length') }),
      }
      req.log.trace(info, `Request completed.`)

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
  req.log = log.child({
    clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  })

  req.log.trace({ url: `${req.baseUrl}${req.url}`, method: req.method }, 'Request received.')
  res.setHeader('x-request-id', req.reqId)

  await morganLog(req, res)
  next()
}
