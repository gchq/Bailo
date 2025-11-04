import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import fetch, { Response } from 'node-fetch'
import PQueue from 'p-queue'
import { Pack } from 'tar-stream'

import { EntryKind, ModelInterface } from '../../models/Model.js'
import { ReleaseDoc } from '../../models/Release.js'
import { UserInterface } from '../../models/User.js'
import config from '../../utils/config.js'
import { BadReq, InternalError } from '../../utils/error.js'
import { shortId } from '../../utils/id.js'
import { getHttpsAgent } from '../http.js'
import log from '../log.js'
import { getModelById } from '../model.js'
import { getImageBlob, getImageManifest, splitDistributionPackageName } from '../registry.js'
import { getReleasesForExport } from '../release.js'
import { BaseExporter } from './exporters/base.js'
import { DocumentsExporter } from './exporters/documents.js'
import { FileExporter } from './exporters/file.js'
import { ImageExporter } from './exporters/image.js'
import { BaseImporter } from './importers/base.js'
import { DocumentsImporter, DocumentsMirrorMetadata, MongoDocumentMirrorInformation } from './importers/documents.js'
import { FileImporter, FileMirrorInformation, FileMirrorMetadata } from './importers/file.js'
import { ImageImporter, ImageMirrorInformation, ImageMirrorMetadata } from './importers/image.js'
import { addEntryToTarGzUpload, extractTarGzStream } from './tarball.js'

export const MirrorKind = {
  Documents: 'documents',
  File: 'file',
  Image: 'image',
} as const

export type MirrorKindKeys<T extends keyof typeof MirrorKind | void = void> = T extends keyof typeof MirrorKind
  ? (typeof MirrorKind)[T]
  : (typeof MirrorKind)[keyof typeof MirrorKind]

export type MirrorMetadata = DocumentsMirrorMetadata | FileMirrorMetadata | ImageMirrorMetadata
export type MirrorInformation = MongoDocumentMirrorInformation | FileMirrorInformation | ImageMirrorInformation

export type MirrorLogData = Record<string, unknown> & ({ exportId: string } | { importId: string })

const exportQueue: PQueue = new PQueue({ concurrency: config.modelMirror.export.concurrency })

export async function exportModel(
  user: UserInterface,
  modelId: string,
  disclaimerAgreement: boolean,
  semvers?: Array<string>,
) {
  if (!config.ui.modelMirror.export.enabled) {
    throw BadReq('Exporting models has not been enabled.')
  }
  if (!disclaimerAgreement) {
    throw BadReq('You must agree to the disclaimer agreement before being able to export a model.')
  }

  const exportId = shortId()
  const model = await getModelById(user, modelId, EntryKind.Model)
  const mirroredModelId = model.settings.mirror.destinationModelId
  const releases: ReleaseDoc[] = []
  if (semvers && semvers.length > 0) {
    releases.push(...(await getReleasesForExport(user, modelId, semvers)))
  }

  const documentsExporter = await new DocumentsExporter(user, model, releases, {
    exportId,
    sourceModelId: modelId,
    semvers,
  }).init()
  // Explicitly check auths before adding to queue to return error to caller
  await documentsExporter.checkAuths()

  log.debug(
    { user, exportId, sourceModelId: modelId, mirroredModelId, semvers },
    'Request checks complete, starting export.',
  )

  // Not `await`ed for fire-and-forget approach
  exportQueue
    .add(async () => {
      await documentsExporter.addData()

      await documentsExporter.finalise()
      log.debug({ exportId, sourceModelId: modelId, mirroredModelId, semvers }, 'Successfully finalized Tarball file.')

      if (releases && releases.length > 0) {
        for (const release of releases) {
          addAndFinaliseExporters(
            await Promise.all(
              documentsExporter.getFiles()!.map((file) =>
                new FileExporter(user, model, file, {
                  fileId: file.id,
                  fileName: file.name,
                  exportId,
                }).init(),
              ),
            ),
            {
              modelId,
              mirroredModelId: mirroredModelId,
              release: release.semver,
              exportId,
            },
          )
          addAndFinaliseExporters(
            await Promise.all(
              release.images.map((image) =>
                new ImageExporter(user, model, release, image, {
                  imageId: image._id.toString(),
                  imageName: image.name,
                  imageTag: image.tag,
                  exportId,
                }).init(),
              ),
            ),
            {
              modelId,
              mirroredModelId,
              release: release.semver,
              exportId,
            },
          )
        }
      }
    })
    .catch((error) => {
      log.error(
        {
          error,
          modelId,
          semvers,
          ...(mirroredModelId && { mirroredModelId }),
          ...(releases && { releases }),
          exportId,
        },
        'Error when exporting mirrored model.',
      )
    })

  return exportId
}

export async function importModel(
  user: UserInterface,
  payloadUrl: string,
): Promise<{
  mirroredModel: ModelInterface
  importResult: MongoDocumentMirrorInformation | FileMirrorInformation | ImageMirrorInformation
}> {
  if (!config.ui.modelMirror.import.enabled) {
    throw BadReq('Importing models has not been enabled.')
  }

  const importId = shortId()
  log.info({ importId, payloadUrl }, 'Received a request to import a model.')

  let res: Response
  try {
    res = await fetch(payloadUrl, { agent: getHttpsAgent() })
  } catch (err) {
    throw InternalError('Unable to get the file.', { err, payloadUrl, importId })
  }
  if (!res.ok) {
    throw InternalError('Unable to get the file.', {
      payloadUrl,
      response: { status: res.status, body: await res.text() },
      importId,
    })
  }
  if (!res.body) {
    throw InternalError('Unable to get the file.', { payloadUrl, importId })
  }
  // type cast `NodeJS.ReadableStream` to `'stream/web'.ReadableStream`
  // as per https://stackoverflow.com/questions/63630114/argument-of-type-readablestreamany-is-not-assignable-to-parameter-of-type-r/66629140#66629140
  // and https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js/74722818#comment133510726_74722818
  const responseBody = res.body instanceof Readable ? res.body : Readable.fromWeb(res.body as unknown as ReadableStream)

  log.info({ payloadUrl, importId }, 'Obtained the file from the payload URL.')

  const importResult = await extractTarGzStream(responseBody, user, { importId })
  log.debug({ importId, importResult }, 'Completed extracting archive.')

  const mirroredModel = await getModelById(user, importResult.metadata.mirroredModelId)

  return {
    mirroredModel,
    importResult,
  }
}

export function getImporter(metadata: MirrorMetadata, user: UserInterface, logData: MirrorLogData): BaseImporter {
  switch (metadata.importKind) {
    case MirrorKind.Documents:
      return new DocumentsImporter(user, metadata, logData)
    case MirrorKind.File:
      return new FileImporter(metadata, logData)
    case MirrorKind.Image:
      return new ImageImporter(user, metadata, logData)
    default:
      throw InternalError(`Unknown \`importKind\` specified in '${config.modelMirror.metadataFile}'.`, {
        metadata,
        ...logData,
      })
  }
}

export async function addCompressedRegistryImageComponents(
  user: UserInterface,
  modelId: string,
  distributionPackageName: string,
  tarStream: Pack,
  logData: MirrorLogData,
) {
  const distributionPackageNameObject = splitDistributionPackageName(distributionPackageName)
  if (!('tag' in distributionPackageNameObject)) {
    throw InternalError('Distribution Package Name must include a tag.', {
      distributionPackageNameObject,
      distributionPackageName,
    })
  }
  const { path: imageName, tag: imageTag } = distributionPackageNameObject
  // get which layers exist for the model
  const tagManifest = await getImageManifest(user, { repository: modelId, name: imageName, tag: imageTag })
  log.debug(
    {
      modelId,
      imageName,
      imageTag,
      layersLength: tagManifest.layers.length,
      layers: tagManifest.layers.map((layer: { [x: string]: any }) => {
        return { size: layer['size'], digest: layer['digest'] }
      }),
      config: tagManifest.config,
      tagManifest,
      ...logData,
    },
    'Got image tag manifest',
  )

  // upload the manifest first as this is the starting point when later importing the blob
  const tagManifestJson = JSON.stringify(tagManifest)
  await addEntryToTarGzUpload(
    tarStream,
    { type: 'text', filename: 'manifest.json', content: tagManifestJson },
    { ...logData, mediaType: tagManifest.mediaType },
  )

  // fetch and compress one layer (including config) at a time to manage RAM usage
  // also, tar can only handle one pipe at a time
  for (const layer of [tagManifest.config, ...tagManifest.layers]) {
    const layerDigest = layer['digest']
    if (!layerDigest || layerDigest.length === 0) {
      throw InternalError('Could not extract layer digest.', { layer, modelId, imageName, imageTag, ...logData })
    }

    log.debug(
      {
        modelId,
        imageName,
        imageTag,
        layerDigest,
        ...logData,
      },
      'Fetching image layer',
    )
    const { stream: responseStream, abort } = await getImageBlob(
      user,
      { repository: modelId, name: imageName },
      layerDigest,
    )

    try {
      // pipe the body to tar using streams
      const entryName = `blobs/sha256/${layerDigest.replace(/^(sha256:)/, '')}`
      await addEntryToTarGzUpload(
        tarStream,
        { type: 'stream', filename: entryName, stream: responseStream, size: layer.size },
        { ...logData, layerDigest, mediaType: layer.mediaType },
      )
    } catch (err) {
      abort()
      throw err
    }
  }
  log.debug({ modelId, imageName, imageTag, ...logData }, 'Finished adding registry image.')
}

export async function addAndFinaliseExporters(exporters: BaseExporter[], logData: MirrorLogData) {
  for (const exporter of exporters) {
    // Not `await`ed for fire-and-forget approach
    exportQueue
      .add(async () => {
        await exporter.addData()
        await exporter.finalise()
      })
      .catch((error) => {
        log.error(
          {
            error,
            ...exporter.getLogData(),
            ...logData,
          },
          `Error when exporting ${exporter.constructor.name}.`,
        )
      })
  }
}

export async function generateDigest(file: Readable) {
  let messageDigest: string
  try {
    const hash = createHash('sha256')
    hash.setEncoding('hex')
    file.pipe(hash)
    messageDigest = await new Promise((resolve, reject) => {
      file.on('error', (err) => {
        file.destroy?.()
        hash.destroy?.()
        reject(InternalError('Error generating SHA256 digest for stream.', { error: err }))
      })
      file.on('end', () => {
        hash.end()
        resolve(hash.read())
      })
    })
    return messageDigest
  } catch (error: unknown) {
    file.destroy?.()
    throw InternalError('Error generating SHA256 digest for stream.', { error })
  }
}
