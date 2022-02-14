import bunyan from 'bunyan'
import { v4 as uuidv4 } from 'uuid'
import { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import devnull from 'dev-null'
import { join, sep } from 'path'
import omit from 'lodash/omit'
import chalk from 'chalk'
import { StatusError } from '../../types/interfaces'

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
    // return `${line}:${src.line}${src.func ? ` in ${src.func}` : ''}`
  }

  getAttributes(data) {
    let attributes = omit(data, ['name', 'hostname', 'pid', 'level', 'msg', 'time', 'src', 'v', 'user'])
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

    return keys.map((key) => `${key}=${String(attributes[key])}`).join(' ')
  }

  write(data) {
    const level = this.getLevel(data.level)
    const src = this.getSrc(data.src)
    const attributes = this.getAttributes(data)

    const message = `${level} - (${src}): ${data.msg}${attributes.length ? ` (${attributes})` : ''}`

    const pipe = data.level >= 40 ? 'stderr' : 'stdout'
    process[pipe].write(message + '\n')
  }
}

const streams: Array<bunyan.Stream> = []

if (process.env.NODE_ENV !== 'production') {
  streams.push({
    level: 'info',
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
})

const morganLog = morgan(
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

  ;(err.logger || req.log).warn(err.data, err.message)
  return res.status(err.code || 500).json({
    message: err.message,
  })
}
