import { PassThrough, Readable } from 'node:stream'
import zlib from 'node:zlib'

import { extract, Headers, Pack, pack } from 'tar-stream'

import { ExportMetadata } from '../services/mirroredModel/mirroredModel.js'
import { uploadToS3 } from '../services/mirroredModel/s3.js'
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

export async function initialiseTarGzUpload(
  fileName: string,
  metadata: ExportMetadata,
  logData?: Record<string, unknown>,
) {
  const { gzipStream, tarStream } = createTarGzStreams()
  // It is safer to have an extra PassThrough for handling backpressure and explicitly closing on error(s)
  const uploadStream = new PassThrough()
  tarStream.pipe(gzipStream).pipe(uploadStream)

  const uploadPromise = uploadToS3(fileName, uploadStream, logData)
  try {
    const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf8')
    tarStream.entry({ name: `metadata.json`, size: metadataBuffer.length, mode: 0o64, type: 'file' }, metadataBuffer)
  } catch (error) {
    // Ensure all streams are destroyed on error to prevent leaks
    tarStream.destroy(error as Error)
    gzipStream.destroy(error as Error)
    uploadStream.destroy(error as Error)
    throw error
  }
  return { tarStream, gzipStream, uploadStream, uploadPromise }
}

export async function finaliseTarGzUpload(tarStream: Pack, uploadPromise: Promise<void>) {
  tarStream.finalize()
  await uploadPromise
}

type TarEntry =
  | { type: 'text'; filename: string; content: string }
  | { type: 'stream'; filename: string; stream: Readable; size?: number }
export async function addEntryToTarGzUpload(tarStream: Pack, entry: TarEntry, logData?: Record<string, unknown>) {
  if (entry.type === 'text') {
    const contentBuffer = Buffer.from(entry.content, 'utf8')
    tarStream.entry(
      { name: `content/${entry.filename}`, size: contentBuffer.length, mode: 0o644, type: 'file' },
      contentBuffer,
    )
  } else if (entry.type === 'stream') {
    await new Promise<void>((resolve, reject) => {
      const tarEntryStream = tarStream.entry(
        { name: `content/${entry.filename}`, size: entry.size ?? undefined, mode: 0o644, type: 'file' },
        (err) => {
          if (err) {
            reject(err)
          }
        },
      )

      entry.stream.pipe(tarEntryStream).on('finish', resolve).on('error', reject)
    })
  } else {
    throw InternalError('Unable to handle entry for tar.gz packing stream', {
      entry,
      ...logData,
    })
  }
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
