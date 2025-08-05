import zlib from 'node:zlib'

import { PassThrough, Readable, Writable } from 'stream'
import { extract, Headers, pack } from 'tar-stream'

import log from '../services/log.js'
import { InternalError } from './error.js'

export type ExtractTarGzEntryListener = (entry: Headers, stream: PassThrough, next: (error?: unknown) => void) => void

export type ExtractTarGzErrorListener = (
  err: unknown,
  resolve: (reason?: unknown) => void,
  reject: (reason?: unknown) => void,
) => void

export type ExtractTarGzFinishListener = (
  resolve: (reason?: unknown) => void,
  reject: (reason?: unknown) => void,
) => void

export function defaultExtractTarGzErrorListener(
  err: unknown,
  _resolve: (reason?: unknown) => void,
  reject: (reason?: unknown) => void,
) {
  reject(InternalError('Error while untarring blob.', { error: err }))
}

export function defaultExtractTarGzFinishListener(
  resolve: (reason?: unknown) => void,
  _reject: (reason?: unknown) => void,
) {
  resolve('ok')
}

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

export async function extractTarGzStream(
  tarGzStream: Readable,
  entryListener: ExtractTarGzEntryListener,
  errorListener: ExtractTarGzErrorListener = defaultExtractTarGzErrorListener,
  finishListener: ExtractTarGzFinishListener = defaultExtractTarGzFinishListener,
) {
  const { ungzipStream, untarStream } = createUnTarGzStreams()
  tarGzStream.pipe(ungzipStream).pipe(untarStream)

  return new Promise((resolve, reject) => {
    untarStream.on('entry', entryListener)

    untarStream.on('error', (err) => {
      errorListener(err, resolve, reject)
    })

    untarStream.on('finish', () => {
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
      inputStream.destroy?.()
      tarEntry.destroy?.()
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
