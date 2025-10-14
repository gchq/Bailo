import { PassThrough, Readable } from 'node:stream'
import { json } from 'node:stream/consumers'
import zlib from 'node:zlib'

import { extract, Pack, pack } from 'tar-stream'

import { ModelAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import { UserInterface } from '../../models/User.js'
import config from '../../utils/config.js'
import { Forbidden, InternalError } from '../../utils/error.js'
import log from '../log.js'
import { validateMirroredModel } from '../model.js'
import { BaseImporter } from './importers/baseImporter.js'
import { DocumentsImporter } from './importers/documentsImporter.js'
import { FileImporter } from './importers/fileImporter.js'
import { ImageImporter } from './importers/imageImporter.js'
import {
  ExportMetadata,
  FileImportInformation,
  ImageImportInformation,
  ImportKind,
  MongoDocumentImportInformation,
} from './mirroredModel.js'
import { uploadToS3 } from './s3.js'

function defaultExtractTarGzErrorListener(
  error: unknown,
  // use `any` as "real" types are not a subtype `unknown`
  _resolve: (reason?: any) => void,
  reject: (reason?: unknown) => void,
  logData?: Record<string, unknown>,
) {
  reject(InternalError('Error processing tarball during import.', { error, ...logData }))
}

function defaultExtractTarGzFinishListener(
  // use `any` as "real" types are not a subtype `unknown`
  _resolve: (reason?: any) => void,
  reject: (reason?: unknown) => void,
  logData?: Record<string, unknown>,
) {
  reject(InternalError('Tarball finished processing before expected.', { ...logData }))
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
    log.debug(
      { metadata, name: config.modelMirror.metadataFile, size: metadataBuffer.length },
      'Creating metadata entry.',
    )

    tarStream.entry(
      { name: config.modelMirror.metadataFile, size: metadataBuffer.length, mode: 0o64, type: 'file' },
      metadataBuffer,
    )
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
  const entryName = `${config.modelMirror.contentDirectory}/${entry.filename}`
  log.debug({ entryName, entry }, 'Adding entry to tarball.')

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
  user: UserInterface,
  logData?: Record<string, unknown>,
): Promise<MongoDocumentImportInformation | FileImportInformation | ImageImportInformation> {
  return new Promise((resolve, reject) => {
    const { ungzipStream, untarStream } = createUnTarGzStreams()
    tarGzStream.pipe(ungzipStream).pipe(untarStream)

    let metadata: ExportMetadata
    let importer: BaseImporter
    let firstEntryProcessed = false

    untarStream.on('error', async (err) => {
      if (importer && importer.errorListener) {
        await importer.errorListener(err, resolve, reject)
      } else {
        defaultExtractTarGzErrorListener(err, resolve, reject, logData)
      }
    })

    untarStream.on('finish', async () => {
      if (importer && importer.finishListener) {
        await importer.finishListener(resolve, reject)
      } else {
        defaultExtractTarGzFinishListener(resolve, reject, logData)
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
          metadata = (await json(stream)) as ExportMetadata

          // Only check auth once we know what the model is
          const mirroredModel = await validateMirroredModel(metadata.mirroredModelId, metadata.sourceModelId, logData)
          const auth = await authorisation.model(user, mirroredModel, ModelAction.Import)
          if (!auth.success) {
            throw Forbidden(auth.info, { userDn: user.dn, modelId: mirroredModel.id, ...logData })
          }

          switch (metadata.importKind) {
            case ImportKind.Documents:
              importer = new DocumentsImporter(user, metadata, logData)
              break
            case ImportKind.File:
              importer = new FileImporter(metadata, logData)
              break
            case ImportKind.Image:
              importer = new ImageImporter(user, metadata, logData)
              break
            default:
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
        if (!metadata) {
          throw InternalError('No metadata available before file processing.', { entry, ...logData })
        }

        // Workaround `stream` sometimes being a reference rather than the stream itself
        const passThrough = new PassThrough()
        stream.pipe(passThrough)
        await importer.processEntry(entry, passThrough)
        next()
      } catch (err) {
        reject(err)
        // bubble error upstream to stop tar processing
        untarStream.destroy(err as Error)
      }
    })
  })
}
