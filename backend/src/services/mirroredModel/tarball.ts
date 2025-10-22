import { PassThrough, Readable } from 'node:stream'
import { json } from 'node:stream/consumers'
import zlib from 'node:zlib'

import { extract, Pack, pack } from 'tar-stream'

import { ModelAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import { BaseImporter } from '../../connectors/mirroredModel/importers/base.js'
import { DocumentsImporter } from '../../connectors/mirroredModel/importers/documents.js'
import { FileImporter } from '../../connectors/mirroredModel/importers/file.js'
import { ImageImporter } from '../../connectors/mirroredModel/importers/image.js'
import { MirrorInformation, MirrorKind, MirrorMetadata } from '../../connectors/mirroredModel/index.js'
import { UserInterface } from '../../models/User.js'
import { isBailoError } from '../../types/error.js'
import config from '../../utils/config.js'
import { Forbidden, InternalError } from '../../utils/error.js'
import log from '../log.js'
import { validateMirroredModel } from '../model.js'
import { mirrorMetadataSchema } from '../specification.js'
import { MirrorLogData } from './mirroredModel.js'
import { uploadToS3 } from './s3.js'

function createTarGzStreams() {
  const gzipStream = zlib.createGzip({ chunkSize: 16 * 1024 * 1024, level: zlib.constants.Z_BEST_SPEED })
  const tarStream = pack()
  return { gzipStream, tarStream }
}

export async function initialiseTarGzUpload(fileName: string, metadata: MirrorMetadata, logData: MirrorLogData) {
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
export async function addEntryToTarGzUpload(tarStream: Pack, entry: TarEntry, logData: MirrorLogData) {
  const entryName = `${config.modelMirror.contentDirectory}/${entry.filename}`
  log.debug({ entryName, entry, ...logData }, 'Adding entry to tarball.')

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
  logData: MirrorLogData,
): Promise<MirrorInformation> {
  return new Promise((resolve, reject) => {
    let metadata: MirrorMetadata
    let importer: BaseImporter
    let firstEntryProcessed = false
    const { ungzipStream, untarStream } = createUnTarGzStreams()

    tarGzStream.pipe(ungzipStream).pipe(untarStream)

    // this error event is expected to always call `reject`
    async function onErrorHandler(error: unknown) {
      if (importer?.errorListener) {
        await importer.errorListener(error, resolve, reject)
      } else {
        if (isBailoError(error)) {
          reject(error)
        } else {
          reject(InternalError('Error processing tarball during import.', { err: error, ...logData }))
        }
      }
    }

    untarStream.on('error', async (error) => {
      await onErrorHandler(error)
    })

    untarStream.on('finish', async () => {
      if (importer?.finishListener) {
        await importer.finishListener(resolve, reject)
      } else {
        // if the importer isn't set then the extract hasn't finished
        reject(InternalError('Tarball finished processing before expected.', { ...logData }))
      }
    })

    untarStream.on('entry', async (entry, stream, next) => {
      try {
        log.debug(
          {
            name: entry.name,
            type: entry.type,
            size: entry.size,
            ...logData,
          },
          'Processing un-tarred entry.',
        )

        if (!firstEntryProcessed) {
          if (entry.type !== 'file' || entry.name !== config.modelMirror.metadataFile) {
            throw InternalError(`Expected '${config.modelMirror.metadataFile}' as first entry, found '${entry.name}'`, {
              entry,
              ...logData,
            })
          }
          metadata = mirrorMetadataSchema.parse(await json(stream))

          // Only check auth once we know what the model is
          const mirroredModel = await validateMirroredModel(metadata.mirroredModelId, metadata.sourceModelId, logData)
          const auth = await authorisation.model(user, mirroredModel, ModelAction.Import)
          if (!auth.success) {
            throw Forbidden(auth.info, { userDn: user.dn, modelId: mirroredModel.id, ...logData })
          }

          switch (metadata.importKind) {
            case MirrorKind.Documents:
              importer = new DocumentsImporter(user, metadata, logData)
              break
            case MirrorKind.File:
              importer = new FileImporter(metadata, logData)
              break
            case MirrorKind.Image:
              importer = new ImageImporter(user, metadata, logData)
              break
            default:
              // This should be unreachable due to the above `mirrorMetadataSchema.parse`
              throw InternalError(`Unknown importKind specified in '${config.modelMirror.metadataFile}'.`, {
                metadata,
                entry,
                ...logData,
              })
          }

          // Drain and continue
          firstEntryProcessed = true
          next()
          return
        }

        // Workaround `stream` sometimes being a reference rather than the stream itself
        const passThrough = new PassThrough()
        stream.pipe(passThrough)
        await importer.processEntry(entry, passThrough)
        next()
      } catch (error) {
        untarStream.destroy()
        await onErrorHandler(error)
      }
    })
  })
}
