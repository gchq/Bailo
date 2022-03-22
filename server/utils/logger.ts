import bunyan from 'bunyan'
import { v4 as uuidv4 } from 'uuid'
import { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import devnull from 'dev-null'
import { join, sep } from 'path'
import { inspect } from 'util'
import omit from 'lodash/omit'
import chalk from 'chalk'
import { castArray, set, get, pick } from 'lodash'
import { StatusError } from '../../types/interfaces'
import { serializedVersionFields } from '../services/version'

class Writer {
  basepath: string

  constructor({ basepath }: { basepath: string }) {
    this.basepath = basepath + sep
  }

  getLevel(level) {
    switch (level) {
      case 10:
        return chalk.gray('trace')
      case 20:
        return 'debug'
      case 30:
        return chalk.cyan('info ')
      case 40:
        return chalk.yellow('warn ')
      case 50:
        return chalk.red('error')
      case 60:
        return chalk.redBright('fatal')
      default:
        return String(level)
    }
  }

  getSrc(src) {
    const line = src.file.replace(this.basepath, '')
    return `${line}:${src.line}`
  }

  representValue(value: any) {
    return typeof value === 'object' ? inspect(value) : String(value)
  }

  getAttributes(data) {
    let attributes = omit(data, ['name', 'hostname', 'pid', 'level', 'msg', 'time', 'src', 'v', 'user', 'timestamp', 'clientIp'])
    let keys = Object.keys(attributes)

    if (['id', 'url', 'method', 'response-time', 'status'].every((k) => keys.includes(k))) {
      // this is probably a req object.
      attributes = omit(attributes, ['id', 'url', 'method', 'response-time', 'status'])
      keys = Object.keys(attributes)
    }

    if (keys.includes('id')) {
      // don't show id if it's a uuid
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attributes.id)) {
        attributes = omit(attributes, ['id'])
        keys = Object.keys(attributes)
      }
    }

    if (!keys.length) {
      return ''
    }

    return keys.map((key) => `${key}=${this.representValue(attributes[key])}`).join(' ')
  }

  write(data) {
    const level = this.getLevel(data.level)
    const src = this.getSrc(data.src)
    const attributes = this.getAttributes(data)
    const formattedAttributes = attributes.length ? ` (${attributes})` : ''

    const message = `${level} - (${src}): ${data.msg}${formattedAttributes}`

    const pipe = data.level >= 40 ? 'stderr' : 'stdout'
    process[pipe].write(message + '\n')
  }
}

export interface SerializerOptions {
  mandatory?: Array<string>
  optional?: Array<string>
  serializable?: Array<any>
}

export function createSerializer(options: SerializerOptions) {
  const mandatory = options.mandatory || []
  const optional = options.optional || []
  const serializable = options.serializable || []
  
  return function(unserialized: any) {
    if (!unserialized) {
      return unserialized
    }

    const asArray = castArray(unserialized)

    if (!asArray.every(item => mandatory.every(value => get(item, value) !== undefined))) {
      return unserialized
    }

    const serialized = asArray.map(item => {
      const segments = pick(item, mandatory.concat(optional))
      const remotes = {}

      serializable.forEach(({ type, field }) => {
        set(remotes, field, type(get(item, field)))
      })

      return { ...segments, ...remotes }
    })

    return Array.isArray(unserialized) ? serialized : serialized[0]
  }
}

const streams: Array<bunyan.Stream> = []

if (process.env.NODE_ENV !== 'production') {
  streams.push({
    level: 'trace',
    type: 'raw',
    stream: new Writer({
      basepath: join(__dirname, '..'),
    }),
  })
}

const log = bunyan.createLogger({
  name: 'bailo',
  level: 'trace',
  src: process.env.NODE_ENV !== 'production',
  streams: streams.length ? streams : undefined,
  serializers: {
    version: createSerializer(serializedVersionFields()),
    versions: createSerializer(serializedVersionFields())
  }
})

const morganLog = morgan<any, any>(
  (tokens, req, res) => {
    req.log.trace(
      {
        url: tokens.url(req, res),
        method: tokens.method(req, res),
        'response-time': tokens['response-time'](req, res),
        status: tokens.status(req, res),
      },
      tokens.dev(morgan, req, res)
    )

    return ''
  },
  {
    skip: (req, _res) => {
      return ['/_next/', '/__nextjs'].some((val) => req.originalUrl.startsWith(val))
    },
    // write to nowhere...
    stream: devnull(),
  }
)

export default log

export async function expressLogger(req: Request, res: Response, next: NextFunction) {
  req.reqId = (req.headers['x-request-id'] as string) || uuidv4()
  req.log = log.child({
    id: req.reqId,
    user: req.user?.id,
    timestamp: new Date().toISOString(),
    clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  })

  res.error = (code: number, error: any) => {
    req.log.warn(error[0], error[1])
    return res.status(code).json({
      message: error[1],
    })
  }

  res.setHeader('x-request-id', req.reqId)

  await new Promise((resolve) => morganLog(req, res, resolve))

  next()
}

export async function expressErrorHandler(
  err: StatusError & { logger: any },
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (!err.code) {
    throw err
  }

  const localLogger = err.logger || req.log

  localLogger.warn(err.data, err.message)
  return res.status(err.code || 500).json({
    message: err.message,
  })
}
