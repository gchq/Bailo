import { PassThrough, Readable } from 'node:stream'
import { json } from 'node:stream/consumers'
import { finished, pipeline } from 'node:stream/promises'
import zlib from 'node:zlib'

import { extract, Pack, pack } from 'tar-stream'

import { ModelAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import { UserInterface } from '../../models/User.js'
import { isBailoError, toBailoError } from '../../types/error.js'
import { MirrorExportLogData, MirrorImportLogData, MirrorInformation, MirrorMetadata } from '../../types/types.js'
import config from '../../utils/config.js'
import { Forbidden, InternalError } from '../../utils/error.js'
import log from '../log.js'
import { validateMirroredModel } from '../model.js'
import { mirrorMetadataSchema } from '../specification.js'
import { BaseImporter } from './importers/base.js'
import { getImporter } from './mirroredModel.js'
import { uploadToS3 } from './s3.js'

function createTarGzStreams() {
  const gzipStream = zlib.createGzip({ chunkSize: 16 * 1024 * 1024, level: zlib.constants.Z_BEST_SPEED })
  const tarStream = pack()
  return { gzipStream, tarStream }
}

export async function initialiseTarGzUpload(fileName: string, metadata: MirrorMetadata, logData: MirrorExportLogData) {
  const { gzipStream, tarStream } = createTarGzStreams()
  // It is safer to have an extra PassThrough for handling backpressure and explicitly closing on error(s)
  const uploadStream = new PassThrough()
  tarStream.pipe(gzipStream).pipe(uploadStream)

  const uploadPromise = uploadToS3(fileName, uploadStream, logData)

  try {
    const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf8')
    log.debug(
      { metadata, name: config.modelMirror.metadataFile, size: metadataBuffer.length, ...logData },
      'Creating metadata entry.',
    )

    tarStream.entry(
      { name: config.modelMirror.metadataFile, size: metadataBuffer.length, mode: 0o64, type: 'file' },
      metadataBuffer,
    )
  } catch (error) {
    // Ensure all streams are destroyed on error to prevent leaks
    tarStream.destroy()
    gzipStream.destroy()
    uploadStream.destroy()
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
export async function addEntryToTarGzUpload(tarStream: Pack, entry: TarEntry, logData: MirrorExportLogData) {
  const entryName = `${config.modelMirror.contentDirectory}/${entry.filename}`
  log.debug(
    {
      entryName,
      entry: { type: entry.type, filename: entry.filename },
      ...logData,
    },
    'Adding entry to tarball.',
  )

  if (entry.type === 'text') {
    const contentBuffer = Buffer.from(entry.content, 'utf8')
    tarStream.entry({ name: entryName, size: contentBuffer.length, mode: 0o644, type: 'file' }, contentBuffer)
  } else if (entry.type === 'stream') {
    await new Promise<void>((resolve, reject) => {
      const tarEntryStream = tarStream.entry(
        { name: entryName, size: entry.size ?? undefined, mode: 0o644, type: 'file' },
        (err) => {
          if (err) {
            reject(err)
          }
        },
      )

      entry.stream.pipe(tarEntryStream).on('finish', resolve).on('error', reject)
    })
  } else {
    throw InternalError('Unable to handle entry for tar.gz packing stream.', {
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

/**
 * Extracts and processes a gzipped tar stream containing a mirrored model export.
 *
 * The stream is expected to contain:
 *   1. A metadata JSON file as the first entry
 *   2. One or more content entries handled by a dynamically selected importer
 *
 * Key design points:
 * - Uses `pipeline()` for correct stream wiring and teardown
 * - Uses `finished()` to capture lifecycle errors (gzip corruption, tar parse errors, premature close)
 * - Uses a `settled` guard to guarantee resolve/reject happens exactly once
 * - All async work inside stream callbacks is explicitly caught and routed to `fail`
 *
 * @param tarGzStream Readable stream containing a gzipped tar archive
 * @param user Authenticated user performing the import
 * @param logData Structured logging context
 * @returns Mirror information produced by the importer
 */
export async function extractTarGzStream(
  tarGzStream: Readable,
  user: UserInterface,
  logData: MirrorImportLogData,
): Promise<MirrorInformation> {
  return new Promise((resolve, reject) => {
    let metadata: MirrorMetadata | undefined
    let importer: BaseImporter | undefined

    // Guards finalisation so that resolve/reject and stream destruction occur exactly once across all async sources:
    // pipeline/finished, untar 'finish', and async entry handlers
    let settled = false

    const { ungzipStream, untarStream } = createUnTarGzStreams()

    // Finalise the operation once, tearing down all streams and rejecting
    function settleOnce(err: unknown) {
      if (settled) {
        return
      }
      settled = true

      tarGzStream.unpipe?.()
      ungzipStream.destroy()
      untarStream.destroy()

      reject(toBailoError(err))
    }

    // Centralised failure path for all synchronous and asynchronous errors.
    function fail(error: unknown) {
      if (settled) {
        return
      }

      if (importer?.handleStreamError) {
        try {
          importer.handleStreamError(error, resolve, reject)
        } catch (err) {
          settleOnce(err)
        }
        settled = true
        return
      }

      if (isBailoError(error)) {
        settleOnce(error)
      } else {
        settleOnce(
          InternalError('Error processing tarball during import.', {
            err: error,
            ...logData,
          }),
        )
      }
    }

    // Stream lifecycle errors (gzip corruption, tar parse errors, premature close)
    finished(untarStream).catch((err) => {
      fail(err)
    })

    // Successful completion of the tar stream
    untarStream.once('finish', () => {
      if (settled) {
        return
      }

      if (!importer) {
        fail(
          InternalError('Tarball finished before importer initialisation.', {
            ...logData,
          }),
        )
        return
      }

      try {
        importer.handleStreamCompletion(resolve, reject)
        settled = true
      } catch (err) {
        fail(err)
      }
    })

    // Handle each tar entry.
    untarStream.on('entry', (entry, entryStream, next) => {
      // This callback must remain synchronous, so all async work is wrapped in an IIFE and explicitly routed to `fail` on error.
      // See https://github.com/gchq/Bailo/pull/3115/changes#r2713416899 for more details.
      ;(async () => {
        try {
          log.debug({ entry, ...logData }, 'Processing un-tarred entry.')

          // First entry must be the metadata file
          if (!metadata) {
            if (entry.type !== 'file' || entry.name !== config.modelMirror.metadataFile) {
              throw InternalError(
                `Expected '${config.modelMirror.metadataFile}' as first entry, found '${entry.name}'`,
                {
                  entry,
                  ...logData,
                },
              )
            }
            metadata = mirrorMetadataSchema.parse(await json(entryStream))
            log.trace({ metadata, ...logData }, `Extracted metadata file '${config.modelMirror.metadataFile}'.`)

            // Only check auth once we know what the model is
            const mirroredModel = await validateMirroredModel(metadata.mirroredModelId, metadata.sourceModelId, logData)
            const auth = await authorisation.model(user, mirroredModel, ModelAction.Import)
            if (!auth.success) {
              throw Forbidden(auth.info, { userDn: user.dn, modelId: mirroredModel.id, ...logData })
            }

            importer = getImporter(metadata, user, logData)

            // Drain and continue
            next()
            return
          }

          // This should be unreachable but TS doesn't know that
          if (!importer) {
            throw InternalError('Importer not initialised.', { entry, ...logData })
          }

          // Workaround `stream` sometimes being a reference rather than the stream itself
          const passThrough = new PassThrough()
          entryStream.pipe(passThrough)

          await importer.processEntry(entry, passThrough)
          next()
        } catch (error) {
          // throw the error and drain the stream
          entryStream.resume()
          fail(error)
        }
      })().catch((err) => fail(err))
    })

    // Wire the stream chain using pipeline for correct teardown and automatic propagation of stream-level errors.
    pipeline(tarGzStream, ungzipStream, untarStream).catch((err) => {
      fail(err)
    })
  })
}
