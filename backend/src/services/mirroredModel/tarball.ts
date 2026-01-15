import { PassThrough, Readable } from 'node:stream'
import { json } from 'node:stream/consumers'
import zlib from 'node:zlib'

import { extract, Pack, pack } from 'tar-stream'

import { ModelAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import { UserInterface } from '../../models/User.js'
import { isBailoError } from '../../types/error.js'
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

export async function extractTarGzStream(
  tarGzStream: Readable,
  user: UserInterface,
  logData: MirrorImportLogData,
): Promise<MirrorInformation> {
  return new Promise((resolve, reject) => {
    let metadata: MirrorMetadata | undefined
    let importer: BaseImporter | undefined
    let settled = false

    const { ungzipStream, untarStream } = createUnTarGzStreams()

    function settleOnce(err: unknown) {
      if (settled) {
        return
      }
      settled = true

      tarGzStream.unpipe()
      ungzipStream.destroy()
      untarStream.destroy()

      reject(err)
    }

    // this error event is expected to always call `reject`
    function fail(error: unknown) {
      if (importer?.handleStreamError) {
        importer.handleStreamError(error, resolve, reject)
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

    ungzipStream.on('error', async (error) => {
      log.error({ error, ...logData }, 'Gunzip stream failed.')
      fail(error)
    })

    untarStream.on('error', async (error) => {
      log.error({ error, ...logData }, 'Tar extraction failed.')
      fail(error)
    })

    untarStream.once('finish', () => {
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

    untarStream.on('entry', async (entry, entryStream, next) => {
      // Async entry handling safely inside a sync stream callback, ensuring all async errors are caught and routed to `fail`
      ;(async () => {
        try {
          log.debug({ entry, ...logData }, 'Processing un-tarred entry.')

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

    tarGzStream.pipe(ungzipStream).pipe(untarStream)
  })
}
