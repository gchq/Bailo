import zlib from 'node:zlib'

import { PassThrough, pipeline, Readable, Writable } from 'stream'
import { extract, Headers, pack } from 'tar-stream'
import { promisify } from 'util'

import log from '../services/log.js'
import { InternalError } from './error.js'

const promisifyPipeline = promisify(pipeline)

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
  reject(InternalError('Error processing tarball during image import.', { error: err }))
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
    let aborted = false
    const abort = (err?: unknown) => {
      if (aborted) {
        return
      }
      aborted = true
      // destroy underlying streams immediately
      tarGzStream.destroy()
      ungzipStream.destroy()
      untarStream.destroy()
      if (err) {
        errorListener(err, resolve, reject)
      }
    }

    untarStream.on('entry', async (entry, stream, next) => {
      if (aborted) {
        stream.resume()
        return
      }

      // Wrap original `next`
      const safeNext = (err?: unknown) => {
        if (err) {
          return abort(err)
        }
        next() // Let tar-stream proceed to next entry
      }

      try {
        await Promise.resolve(entryListener(entry, stream, safeNext))
      } catch (err) {
        safeNext(err)
      }
    })

    untarStream.on('error', (err) => abort(err))

    untarStream.on('finish', () => {
      if (!aborted) {
        finishListener(resolve, reject)
      }
    })
  })
}

export async function pipeStreamToTarEntry(
  inputStream: Readable,
  tarEntry: Writable,
  logData: Record<string, string> = {},
): Promise<'ok'> {
  try {
    await promisifyPipeline(inputStream, tarEntry)
    log.debug({ ...logData }, 'Finished fetching stream')
    return 'ok'
  } catch (error: unknown) {
    throw InternalError('Stream error during tar operation', {
      error,
      ...logData,
    })
  }
}
