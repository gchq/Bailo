/* eslint-disable max-classes-per-file, no-console */
import { WritableStream } from 'node:stream/web'

import getAppRoot from 'app-root-path'
import bunyan from 'bunyan'
import chalk from 'chalk'
import devnull from 'dev-null'
import { NextFunction, Request, Response } from 'express'
import fsPromise from 'fs/promises'
import { omit } from 'lodash-es'
import morgan from 'morgan'
import { gzip } from 'pako'
import { join, resolve, sep } from 'path'
import stripAnsi from 'strip-ansi'
import { fileURLToPath } from 'url'
import { inspect } from 'util'
import { v4 as uuidv4 } from 'uuid'

import LogModel from '../models/Log.js'
import config from './config.js'
import { ensurePathExists, getFilesInDir } from './filesystem.js'
import { BailoError } from './result.js'
import serializers from './serializers.js'

const appRoot = getAppRoot.toString()

class Writer extends WritableStream {
  basepath: string

  constructor({ basepath }: { basepath: string }) {
    super()
    this.basepath = basepath + sep
  }

  static getLevel(level: number) {
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

  getSrc(src: { file: string; line: any }) {
    const line = src.file.replace(this.basepath, '')
    return `${line}:${src.line}`
  }

  static representValue(value: unknown) {
    return typeof value === 'object' ? inspect(value) : String(value)
  }

  static getAttributes(data: any) {
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

  write(data: { level: number; src: any; msg: any }) {
    const level = Writer.getLevel(data.level)
    const src = data.src ? this.getSrc(data.src) : undefined
    const attributes = Writer.getAttributes(data)
    const formattedAttributes = attributes.length ? ` (${attributes})` : ''

    const message = `${level} - (${src}): ${data.msg}${formattedAttributes}`

    const pipe = data.level >= 40 ? 'stderr' : 'stdout'
    process[pipe].write(`${message}\n`)
  }
}

function redactUnsafeSymbols(obj: unknown, depth = 0, redactedSymbols = /[$.{}]/g) {
  if (Array.isArray(obj) || obj === null || typeof obj !== 'object') {
    return obj
  }

  if (depth > 4) {
    return obj
  }

  const safeObj = {}

  for (const key of Object.keys(obj)) {
    const redactedKey = key.replace(redactedSymbols, '')
    safeObj[redactedKey] = redactUnsafeSymbols(obj[key], depth + 1, redactedSymbols)
  }

  return safeObj
}

class MongoWriter {
  async write(data: any) {
    // sometimes we are unable to write log messages to the database
    if (data.log === false) {
      return
    }

    const safeData = redactUnsafeSymbols(data)
    const log = new LogModel(safeData)
    await log.save()
  }
}

const streams: Array<bunyan.Stream> = [
  {
    level: 'trace',
    type: 'raw',
    stream: new MongoWriter(),
  },
]

if (process.env.NODE_ENV !== 'production') {
  let currentDirectory
  try {
    currentDirectory = __dirname
  } catch (e) {
    currentDirectory = fileURLToPath(new URL('.', import.meta.url))
  }

  streams.push({
    level: 'trace',
    type: 'raw',
    stream: new Writer({
      basepath: join(currentDirectory, '..'),
    }) as any,
  })
} else {
  streams.push({
    level: 'trace',
    stream: process.stdout,
  })
}

if (config.logging.file.enabled) {
  const logPath = resolve(appRoot, config.logging.file.path)

  ensurePathExists(logPath, true)

  streams.push({
    level: config.logging.file.level as any,
    path: logPath,
  })
}

async function processStroomFiles() {
  const stroomFolder = resolve(appRoot, config.logging.stroom.folder)
  const processingFolder = resolve(stroomFolder, 'processing')

  const files = await getFilesInDir(stroomFolder)
  for (const file of files) {
    const from = resolve(stroomFolder, file.name)
    const to = resolve(processingFolder, file.name)

    const { size } = await fsPromise.stat(from)

    if (size >= 0) {
      await fsPromise.rename(from, to)
    }
  }

  const processing = await getFilesInDir(processingFolder)
  for (const file of processing) {
    const name = resolve(processingFolder, file.name)
    try {
      await sendLogsToStroom(name)
    } catch (e) {
      log.error('Unable to send logs to stroom', e)
    }
  }
}

async function sendLogsToStroom(file: string) {
  const logBuffer = await fsPromise.readFile(file)

  const res = await fetch(config.logging.stroom.url, {
    method: 'POST',
    body: await gzip(logBuffer),
    headers: {
      Compression: 'gzip',
      Feed: config.logging.stroom.feed,
      Environment: config.logging.stroom.environment,
      System: config.logging.stroom.system,
    },
  })

  if (!res.ok) {
    throw new Error('Failed to send logs to stroom')
  }

  await fsPromise.unlink(file)
}

if (config.logging.stroom.enabled) {
  const stroomFolder = resolve(appRoot, config.logging.stroom.folder)
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

  // send logs to stroom every hour
  processStroomFiles()
  setInterval(() => {
    date = new Date()
    processStroomFiles()
  }, config.logging.stroom.interval)

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
  serializers,
})

const morganLog = morgan<any, any>(
  (tokens, req, res) => {
    const message = tokens.dev(morgan, req, res) || ''

    req.log.trace(
      {
        url: tokens.url(req, res),
        method: tokens.method(req, res),
        'response-time': tokens['response-time'](req, res),
        status: tokens.status(req, res),
        code: 'approval',
      },
      process.env.NODE_ENV == 'production' ? stripAnsi(message) : message,
    )

    return ''
  },
  {
    skip: (req, _res) => ['/_next/', '/__nextjs'].some((val) => req.originalUrl.startsWith(val)),
    // write to nowhere...
    stream: devnull(),
  },
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

export async function expressErrorHandler(err: BailoError, req: Request, res: Response, _next: NextFunction) {
  if (!err.code) {
    console.log('no error code found')
    console.log('error', err)
    throw err
  }

  const localLogger = err.logger || req.log

  localLogger.warn(err.data, err.message)

  let code = err.code || 500
  if (typeof code !== 'number') code = 500
  if (code < 100) code = 500
  if (code >= 600) code = 500

  return res.status(code).json({
    error: {
      message: err.message,
      id: err.id,
      documentationUrl: err.documentationUrl,
    },
  })
}

/**
 * These utility functions are only to be used for logging that is intended to be
 * used in production, to prevent us having to disable eslint in multiple places.
 * This way we can rely on eslint to pick up any forgotten logging that was used
 * for debugging purposes during development.
 */

export const consoleLog = (message: string, ...optionalParams: unknown[]): void => {
  console.log(message, ...optionalParams)
}

export const consoleInfo = (message: string, ...optionalParams: unknown[]): void => {
  console.info(message, ...optionalParams)
}

export const consoleWarn = (message: string, ...optionalParams: unknown[]): void => {
  console.warn(message, ...optionalParams)
}

export const consoleError = (message: string, ...optionalParams: unknown[]): void => {
  console.error(message, ...optionalParams)
}
