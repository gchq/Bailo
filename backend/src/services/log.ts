import { WritableStream } from 'node:stream/web'

import { OpenTelemetryBunyanStream } from '@opentelemetry/instrumentation-bunyan'
import bunyan from 'bunyan'
import chalk from 'chalk'
import { omit } from 'lodash-es'
import path, { join } from 'path'
import util from 'util'

import config from '../utils/config.js'
import { getDirectory } from '../utils/fs.js'

interface BunyanLog {
  level: number
  src: { file: string; line: number }
  msg: string
}
export function isBunyanLogGuard(data: unknown): data is BunyanLog {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  if (!('level' in data) || typeof data.level !== 'number') {
    return false
  }

  if (!('msg' in data) || typeof data.msg !== 'string') {
    return false
  }

  if (!('src' in data) || typeof data.src !== 'object') {
    return false
  }

  return true
}

export class Writer extends WritableStream {
  basepath: string

  constructor({ basepath }: { basepath: string }) {
    super()
    this.basepath = basepath + path.sep
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

    if (line.startsWith('routes/middleware/expressLogger.ts')) {
      return 'express'
    }

    return `${line}:${src.line}`
  }

  static representValue(value: unknown) {
    return typeof value === 'object' ? util.inspect(value) : String(value)
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

  write(data: unknown) {
    if (!isBunyanLogGuard(data)) {
      throw new Error('Received unknown value to the log writer: ' + util.inspect(data))
    }

    const level = Writer.getLevel(data.level)
    const src = data.src ? this.getSrc(data.src) : undefined
    const attributes = Writer.getAttributes(data)
    const formattedAttributes = attributes.length ? ` (${attributes})` : ''

    const message = `${level} - (${src}): ${data.msg}${formattedAttributes}`

    const pipe = data.level >= 40 ? 'stderr' : 'stdout'
    process[pipe].write(`${message}\n`)
  }
}

const streams: Array<bunyan.Stream> = []

if (process.env.NODE_ENV !== 'production') {
  // In development environments, style logs before output
  const currentDirectory = getDirectory(import.meta.url)

  streams.push({
    level: 'trace',
    type: 'raw',
    stream: new Writer({
      basepath: join(currentDirectory, '..', '..'),
    }),
  })
} else {
  // In production environments output plain JSON logs
  streams.push({
    level: config.log.level,
    stream: process.stdout,
  })
}
if (config.instrumentation.enabled) {
  streams.push({
    type: 'raw',
    stream: new OpenTelemetryBunyanStream(),
  })
}

const log = bunyan.createLogger({
  name: 'bailo',
  level: config.log.level,
  src: process.env.NODE_ENV !== 'production',
  streams: streams.length ? streams : undefined,
})

export default log
