import zlib from 'node:zlib'

import { PassThrough, Readable, Writable } from 'stream'
import { extract, Headers, pack } from 'tar-stream'

import log from '../services/log.js'
import { InternalError } from './error.js'

export function createTarGzStreams() {
  const gzipStream = zlib.createGzip({ chunkSize: 16 * 1024 * 1024, level: zlib.constants.Z_BEST_SPEED })
  const tarStream = pack()
  return { gzipStream, tarStream }
}

export function createUnTarGzStreams() {
  const ungzipStream = zlib.createGunzip({ chunkSize: 16 * 1024 * 1024 })
  const untarStream = extract()
  return { ungzipStream, untarStream }
}

function extractTarGzDefaultErrorListener(
  err: unknown,
  _resolve: (reason?: any) => void,
  reject: (reason?: any) => void,
) {
  reject(
    InternalError('Error while un-tarring blob', {
      error: err,
    }),
  )
}

function extractTarGzDefaultFinishListener(resolve: (reason?: any) => void, _reject: (reason?: any) => void) {
  resolve('ok')
}

export async function extractTarGzStream(
  tarGzStream: Readable,
  entryListener: (entry: Headers, stream: PassThrough, next: (error?: unknown) => void) => Promise<void>,
  errorListener: (
    err: unknown,
    resolve: (reason?: any) => void,
    reject: (reason?: any) => void,
  ) => void = extractTarGzDefaultErrorListener,
  finishListener: (
    resolve: (reason?: any) => void,
    reject: (reason?: any) => void,
  ) => void = extractTarGzDefaultFinishListener,
) {
  const { ungzipStream, untarStream } = createUnTarGzStreams()
  tarGzStream.pipe(ungzipStream).pipe(untarStream)

  return new Promise((resolve, reject) => {
    untarStream.on('entry', entryListener)

    untarStream.on('error', (err) => {
      errorListener(err, resolve, reject)
    })

    untarStream.on('finish', async function () {
      finishListener(resolve, reject)
    })
  })
}

export async function pipeStreamToTarEntry(
  inputStream: Readable,
  tarEntry: Writable,
  logData: { [key: string]: string } = {},
) {
  return new Promise((resolve, reject) => {
    const onError = (err: any) => {
      inputStream.destroy()
      tarEntry.destroy()
      reject(
        InternalError('Stream error during tar operation', {
          error: err,
          ...logData,
        }),
      )
    }
    inputStream.pipe(tarEntry)
    tarEntry.on('finish', () => {
      log.debug({ ...logData }, 'Finished fetching stream')
      resolve('ok')
    })
    tarEntry.on('error', onError)
    inputStream.on('error', onError)
  })
}
