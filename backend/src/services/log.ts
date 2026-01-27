import pino from 'pino'
import { pinoHttp } from 'pino-http'
import { v4 } from 'uuid'

import config from '../utils/config.js'

const targets: pino.TransportTargetOptions<Record<string, any>>[] = []

if (process.env.NODE_ENV !== 'production') {
  targets.push({
    level: config.log.level,
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  })
} else {
  // In production environments output plain JSON logs
  targets.push({
    level: config.log.level,
    target: 'pino/file',
    options: { destination: 1 },
  })
}

if (config.instrumentation.enabled) {
  targets.push({
    target: 'pino-opentelemetry-transport',
  })
}

const log = pino({
  name: 'bailo',
  level: config.log.level,
  transport: {
    targets,
  },
})

export default log

export const httpLog = pinoHttp({
  logger: log,
  serializers: {
    req: function customReqSerializer(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        user: req.raw.user,
        clientIp: req.headers['x-forwarded-for'] || req.remoteAddress,
        ...(req.headers['user-agent'] && { agent: req.headers['user-agent'] }),
        // trim each value in body to 128 characters maximum
        ...(req.body && {
          body: Object.fromEntries(
            Object.entries(req.body).map(([k, v]) => [
              k,
              typeof v === 'string' ? v.substring(0, 128) : JSON.stringify(v).substring(0, 128),
            ]),
          ),
        }),
      }
    },
    res: function customResSerializer(res) {
      return {
        id: res.id,
        statusCode: res.statusCode,
      }
    },
  },
  genReqId: function (req, res) {
    const existingID = req.id ?? req.headers['x-request-id']
    if (existingID) {
      return existingID
    }
    const id = v4()
    res.setHeader('x-request-id', id)
    return id
  },
})
