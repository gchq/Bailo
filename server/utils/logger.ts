import getAppRoot from 'app-root-path'
import bunyan from 'bunyan'
import chalk from 'chalk'
import { gzip } from 'pako'
import config from 'config'
import devnull from 'dev-null'
import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import fsPromise from 'fs/promises'
import { castArray, get, pick, set } from 'lodash'
import omit from 'lodash/omit'
import { WritableStream } from 'node:stream/web'
import morgan from 'morgan'
import { dirname, join, resolve, sep } from 'path'
import { inspect } from 'util'
import { v4 as uuidv4 } from 'uuid'
import { StatusError } from '../../types/interfaces'
import { serializedDeploymentFields } from '../services/deployment'
import { serializedModelFields } from '../services/model'
import { serializedSchemaFields } from '../services/schema'
import { serializedUserFields } from '../services/user'
import { serializedVersionFields } from '../services/version'
import { ensurePathExists, getFilesInDir } from './filesystem'

const appRoot = getAppRoot.toString()

class Writer {
  basepath: string

  constructor({ basepath }: { basepath: string }) {
    this.basepath = basepath + sep
  }

  static getLevel(level) {
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

  static representValue(value: any) {
    return typeof value === 'object' ? inspect(value) : String(value)
  }

  getAttributes(data) {
    let attributes = omit(data, [
      'name',
      'hostname',
      'pid',
      'level',
      'msg',
      'time',
      'src',
      'v',
      'user',
      'timestamp',
      'clientIp',
    ])
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

    return keys.map((key) => `${key}=${Writer.representValue(attributes[key])}`).join(' ')
  }

  write(data) {
    const level = Writer.getLevel(data.level)
    const src = this.getSrc(data.src)
    const attributes = this.getAttributes(data)
    const formattedAttributes = attributes.length ? ` (${attributes})` : ''

    const message = `${level} - (${src}): ${data.msg}${formattedAttributes}`

    const pipe = data.level >= 40 ? 'stderr' : 'stdout'
    process[pipe].write(`${message}\n`)
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

  return function (unserialized: any) {
    if (!unserialized) {
      return unserialized
    }

    const asArray = castArray(unserialized)

    if (!asArray.every((item) => mandatory.every((value) => get(item, value) !== undefined))) {
      return unserialized
    }

    const serialized = asArray.map((item) => {
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
    level: 'info',
    type: 'raw',
    stream: new Writer({
      basepath: join(__dirname, '..'),
    }),
  })
}

if (config.get('logging.file.enabled')) {
  const logPath = resolve(appRoot, config.get('logging.file.path'))

  ensurePathExists(logPath, true)

  streams.push({
    level: config.get('logging.file.level'),
    path: logPath,
  })
}

async function processStroomFiles() {
  const stroomFolder = resolve(appRoot, config.get('logging.stroom.folder'))
  const processingFolder = resolve(stroomFolder, 'processing')

  const files = await getFilesInDir(stroomFolder)
  for (const file of files) {
    const from = resolve(stroomFolder, file.name)
    const to = resolve(processingFolder, file.name)

    const { size } = await fsPromise.stat(from)

    if (size < 0) {
      continue
    }

    await fsPromise.rename(from, to)
  }

  const processing = await getFilesInDir(processingFolder)
  for (const file of processing) {
    const name = resolve(processingFolder, file.name)
    try {
      await sendLogsToStroom(name)
    } catch (e) {
      // ironically we cannot use our logger here.
      console.error(e, 'Unable to send logs to ACE')
    }
  }
}

async function sendLogsToStroom(file: string) {
  const logBuffer = await fsPromise.readFile(file)

  const res = await fetch(config.get('logging.stroom.url'), {
    method: 'POST',
    body: await gzip(logBuffer),
    headers: {
      Compression: 'gzip',
      Feed: config.get('logging.stroom.feed'),
      Environment: config.get('logging.stroom.environment'),
      System: config.get('logging.stroom.system'),
    },
  })

  if (!res.ok) {
    throw new Error('Failed to send logs to stroom')
  }

  await fsPromise.unlink(file)
}

if (config.get('logging.stroom.enabled')) {
  const stroomFolder = resolve(appRoot, config.get('logging.stroom.folder'))
  const processingFolder = resolve(stroomFolder, 'processing')
  const processedFolder = resolve(stroomFolder, 'processed')

  ensurePathExists(stroomFolder, true)
  ensurePathExists(processingFolder, true)
  ensurePathExists(processedFolder, true)

  let date = new Date()

  const stroomStream = new WritableStream({
    async write(message) {
      if (message.code) {
        const path = resolve(stroomFolder, `logs.${+date}.txt`)
        await fsPromise.appendFile(path, `${JSON.stringify(message)}\n`)
      }
    },
  })

  // send logs to ACE every hour
  processStroomFiles()
  setInterval(() => {
    date = new Date()
    processStroomFiles()
  }, 1000 * 60 * 60)

  streams.push({
    level: 'trace',
    type: 'raw',
    stream: stroomStream.getWriter(),
  })
}

const log = bunyan.createLogger({
  name: 'bailo',
  level: 'trace',
  src: process.env.NODE_ENV !== 'production',
  streams: streams.length ? streams : undefined,
  serializers: {
    version: createSerializer(serializedVersionFields()),
    versions: createSerializer(serializedVersionFields()),
    model: createSerializer(serializedModelFields()),
    models: createSerializer(serializedModelFields()),
    deployment: createSerializer(serializedDeploymentFields()),
    deployments: createSerializer(serializedDeploymentFields()),
    schema: createSerializer(serializedSchemaFields()),
    schemas: createSerializer(serializedSchemaFields()),
    user: createSerializer(serializedUserFields()),
    users: createSerializer(serializedUserFields()),
  },
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
    skip: (req, _res) => ['/_next/', '/__nextjs'].some((val) => req.originalUrl.startsWith(val)),
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
    clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  })

  res.error = (code: number, error: any) => {
    req.log.warn(error[0], error[1])
    return res.status(code || 500).json({
      message: error[1],
    })
  }

  res.setHeader('x-request-id', req.reqId)

  await new Promise((r) => {
    morganLog(req, res, r)
  })

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

  const code = typeof err.code === 'number' && err.code > 100 && err.code < 600 ? err.code : 500
  const localLogger = err.logger || req.log

  localLogger.warn(err.data, err.message)
  return res.status(err.code || 500).json({
    message: err.message,
  })
}
