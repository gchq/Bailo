import { createHash } from 'node:crypto'
import stream, { PassThrough, Readable } from 'node:stream'
import zlib from 'node:zlib'

import { ObjectId } from 'mongoose'
import fetch, { Response } from 'node-fetch'
import PQueue from 'p-queue'
import prettyBytes from 'pretty-bytes'
import { Pack } from 'tar-stream'

import { ModelAction } from '../../connectors/authorisation/actions.js'
import authorisation from '../../connectors/authorisation/index.js'
import { ScanState } from '../../connectors/fileScanning/Base.js'
import scanners from '../../connectors/fileScanning/index.js'
import { FileWithScanResultsInterface } from '../../models/File.js'
import { ModelDoc, ModelInterface } from '../../models/Model.js'
import { ModelCardRevisionDoc } from '../../models/ModelCardRevision.js'
import { ReleaseDoc } from '../../models/Release.js'
import { UserInterface } from '../../models/User.js'
import config from '../../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../../utils/error.js'
import { shortId } from '../../utils/id.js'
import { addEntryToTarGzUpload, finaliseTarGzUpload, initialiseTarGzUpload } from '../../utils/tarball.js'
import { downloadFile, getFilesByIds, getTotalFileSize } from '../file.js'
import { getHttpsAgent } from '../http.js'
import log from '../log.js'
import { getModelById, getModelCardRevisions, validateMirroredModel } from '../model.js'
import {
  getImageBlob,
  getImageManifest,
  joinDistributionPackageName,
  splitDistributionPackageName,
} from '../registry.js'
import { getAllFileIds, getReleasesForExport } from '../release.js'
import { importDocuments } from './importers/documentImporter.js'
import { importModelFile } from './importers/fileImporter.js'
import { importCompressedRegistryImage } from './importers/imageImporter.js'

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
  const model = await getModelById(user, modelId)
  if (!model.settings.mirror.destinationModelId) {
    throw BadReq(`The 'Destination Model ID' has not been set on this model.`)
  }
  if (!model.card || !model.card.schemaId) {
    throw BadReq('You must select a schema for your model before you can start the export process.')
  }
  const modelAuth = await authorisation.model(user, model, ModelAction.Export)
  if (!modelAuth.success) {
    throw Forbidden(modelAuth.info, { userDn: user.dn, modelId })
  }

  const mirroredModelId = model.settings.mirror.destinationModelId
  const releases: ReleaseDoc[] = []
  if (semvers && semvers.length > 0) {
    releases.push(...(await getReleasesForExport(user, model.id, semvers)))
    await checkReleaseFiles(user, model.id, semvers)
  }
  log.debug('Request checks complete')

  let tarStream: Pack | undefined,
    gzipStream: zlib.Gzip | undefined,
    uploadStream: PassThrough | undefined,
    uploadPromise: Promise<void> | undefined

  try {
    ;({ tarStream, gzipStream, uploadStream, uploadPromise } = await initialiseTarGzUpload(
      `${modelId}.tar.gz`,
      { exporter: user.dn, sourceModelId: modelId, mirroredModelId, importKind: ImportKind.Documents },
      { semvers },
    ))

    try {
      await addModelCardRevisionsToTarball(user, model, tarStream)
    } catch (error) {
      throw InternalError('Error when adding the model card revision(s) to the Tarball file.', { error })
    }
    try {
      if (releases.length > 0) {
        await addReleasesToTarball(user, model, releases, tarStream, mirroredModelId)
      }
    } catch (error) {
      throw InternalError('Error when adding the release(s) to the Tarball file.', { error })
    }

    // Don't await as this isn't queued and we want to return the endpoint
    finaliseTarGzUpload(tarStream, uploadPromise)
  } catch (error) {
    // Ensure all streams are destroyed on error to prevent leaks
    tarStream?.destroy(error as Error)
    gzipStream?.destroy(error as Error)
    uploadStream?.destroy(error as Error)
    throw error
  }

  log.debug({ modelId, semvers }, 'Successfully finalized Tarball file.')
}

export const ImportKind = {
  Documents: 'documents',
  File: 'file',
  Image: 'image',
} as const

export type ImportKindKeys<T extends keyof typeof ImportKind | void = void> = T extends keyof typeof ImportKind
  ? (typeof ImportKind)[T]
  : (typeof ImportKind)[keyof typeof ImportKind]

export type MongoDocumentImportInformation = {
  modelCardVersions: ModelCardRevisionDoc['version'][]
  newModelCards: Omit<ModelCardRevisionDoc, '_id'>[]
  releaseSemvers: ReleaseDoc['semver'][]
  newReleases: Omit<ReleaseDoc, '_id'>[]
  fileIds: ObjectId[]
  imageIds: string[]
}
export type FileImportInformation = {
  sourcePath: string
  newPath: string
}
export type ImageImportInformation = {
  image: { modelId: string; imageName: string; imageTag: string }
}

export type ExportMetadata = {
  sourceModelId: string
  mirroredModelId: string
  exporter: string
} & (
  | { importKind: ImportKindKeys<'Documents'> }
  | { importKind: ImportKindKeys<'File'>; filePath: string }
  | { importKind: ImportKindKeys<'Image'>; distributionPackageName: string }
)

export async function importModel(
  user: UserInterface,
  mirroredModelId: string,
  sourceModelId: string,
  payloadUrl: string,
  importKind: ImportKindKeys,
  fileId?: string,
  distributionPackageName?: string,
): Promise<{
  mirroredModel: ModelInterface
  importResult: MongoDocumentImportInformation | FileImportInformation | ImageImportInformation
}> {
  if (!config.ui.modelMirror.import.enabled) {
    throw BadReq('Importing models has not been enabled.')
  }

  if (mirroredModelId === '') {
    throw BadReq('Missing mirrored model ID.')
  }

  const importId = shortId()
  log.info({ importId, mirroredModelId, payloadUrl }, 'Received a request to import a model.')
  const mirroredModel = await validateMirroredModel(mirroredModelId, sourceModelId, importId)

  const auth = await authorisation.model(user, mirroredModel, ModelAction.Import)
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId: mirroredModel.id, importKind, importId })
  }

  let res: Response
  try {
    res = await fetch(payloadUrl, { agent: getHttpsAgent() })
  } catch (err) {
    throw InternalError('Unable to get the file.', { err, payloadUrl, importKind, importId })
  }
  if (!res.ok) {
    throw InternalError('Unable to get the file.', {
      payloadUrl,
      response: { status: res.status, body: await res.text() },
      importKind,
      importId,
    })
  }

  if (!res.body) {
    throw InternalError('Unable to get the file.', { payloadUrl, importKind, importId })
  }
  // type cast `NodeJS.ReadableStream` to `'stream/web'.ReadableStream`
  // as per https://stackoverflow.com/questions/63630114/argument-of-type-readablestreamany-is-not-assignable-to-parameter-of-type-r/66629140#66629140
  // and https://stackoverflow.com/questions/37614649/how-can-i-download-and-save-a-file-using-the-fetch-api-node-js/74722818#comment133510726_74722818
  const responseBody = res.body instanceof Readable ? res.body : Readable.fromWeb(res.body as unknown as ReadableStream)

  log.info({ mirroredModelId, payloadUrl, importKind, importId }, 'Obtained the file from the payload URL.')

  switch (importKind) {
    case ImportKind.Documents: {
      log.info({ mirroredModelId, payloadUrl, importKind, importId }, 'Importing collection of documents.')
      return await importDocuments(user, responseBody, mirroredModelId, sourceModelId, payloadUrl, importId)
    }
    case ImportKind.File: {
      log.info({ mirroredModelId, payloadUrl, importKind, importId }, 'Importing file data.')
      if (!fileId) {
        throw BadReq('File ID must be specified for file import.', {
          mirroredModelId,
          sourceModelIdMeta: sourceModelId,
          importKind,
          importId,
        })
      }
      const result = await importModelFile(responseBody, fileId, mirroredModelId, importId)
      return {
        mirroredModel,
        importResult: {
          ...result,
        },
      }
    }
    case ImportKind.Image: {
      log.info({ mirroredModelId, payloadUrl, importKind, importId }, 'Importing image data.')
      if (!distributionPackageName) {
        throw BadReq('Missing Distribution Package Name.', {
          mirroredModelId,
          sourceModelIdMeta: sourceModelId,
          importKind,
          importId,
        })
      }
      const result = await importCompressedRegistryImage(
        user,
        responseBody,
        mirroredModelId,
        distributionPackageName,
        importId,
      )
      return {
        mirroredModel,
        importResult: {
          ...result,
        },
      }
    }
    default:
      throw BadReq('Unrecognised import kind', {
        mirroredModelId,
        sourceModelIdMeta: sourceModelId,
        importKind,
        importId,
      })
  }
}

export async function addCompressedRegistryImageComponents(
  user: UserInterface,
  modelId: string,
  distributionPackageName: string,
  tarStream: Pack,
  logData?: Record<string, unknown>,
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
  const tagManifest = await getImageManifest(user, modelId, imageName, imageTag)
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
  addEntryToTarGzUpload(
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
    const { stream: responseStream, abort } = await getImageBlob(user, modelId, imageName, layerDigest)

    try {
      // pipe the body to tar using streams
      const entryName = `blobs/sha256/${layerDigest.replace(/^(sha256:)/, '')}`
      addEntryToTarGzUpload(
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

async function addModelCardRevisionsToTarball(user: UserInterface, model: ModelDoc, tarStream: Pack) {
  log.debug({ user, modelId: model.id }, 'Adding model card revisions to Tarball file.')
  const cards = await getModelCardRevisions(user, model.id)
  for (const card of cards) {
    const cardJson = JSON.stringify(card.toJSON())
    await addEntryToTarGzUpload(
      tarStream,
      { type: 'text', filename: `${card.version}.json`, content: cardJson },
      { modelId: model.id },
    )
  }
  log.debug({ user, modelId: model.id }, 'Completed adding model card revisions to Tarball file.')
}

async function addReleasesToTarball(
  user: UserInterface,
  model: ModelDoc,
  releases: ReleaseDoc[],
  tarStream: Pack,
  mirroredModelId: string,
) {
  const semvers = releases.map((release) => release.semver)
  log.debug({ user, modelId: model.id, semvers }, 'Adding model releases to Tarball file.')

  const queue = new PQueue({ concurrency: config.modelMirror.export.concurrency })
  const errors: any[] = []
  // Using a .catch here to ensure all errors are returned, rather than just the first error.
  await Promise.all(
    releases.map((release) =>
      addReleaseToTarball(user, model, release, tarStream, mirroredModelId, queue).catch((e) => errors.push(e)),
    ),
  )
  if (errors.length > 0) {
    throw InternalError('Error when adding release(s) to Tarball file.', { errors })
  }
  log.debug({ user, modelId: model.id, semvers }, 'Completed adding model releases to Tarball file.')
}

export async function uploadReleaseFiles(
  user: UserInterface,
  model: ModelDoc,
  release: ReleaseDoc,
  files: FileWithScanResultsInterface[],
  mirroredModelId: string,
  queue: PQueue,
) {
  for (const file of files) {
    const fileLogData = {
      releaseId: release.id,
      sourceModelId: model.id,
      fileId: file.id,
    }
    queue
      .add(async () => {
        let tarStream: Pack | undefined,
          gzipStream: zlib.Gzip | undefined,
          uploadStream: PassThrough | undefined,
          uploadPromise: Promise<void> | undefined
        try {
          ;({ tarStream, gzipStream, uploadStream, uploadPromise } = await initialiseTarGzUpload(
            `${file.id}.tar.gz`,
            {
              exporter: user.dn,
              sourceModelId: model.id,
              mirroredModelId,
              filePath: file.id,
              importKind: ImportKind.File,
            },
            fileLogData,
          ))

          await addEntryToTarGzUpload(
            tarStream,
            {
              type: 'stream',
              filename: file.id,
              stream: (await downloadFile(user, file.id)).Body as stream.Readable,
              size: file.size,
            },
            fileLogData,
          )

          await finaliseTarGzUpload(tarStream, uploadPromise)
        } catch (error) {
          // Ensure all streams are destroyed on error to prevent leaks
          tarStream?.destroy(error as Error)
          gzipStream?.destroy(error as Error)
          uploadStream?.destroy(error as Error)
          throw error
        }
      })
      .catch((error) =>
        log.error(
          {
            error,
            modelId: model.id,
            releaseSemver: release.semver,
            fileId: file.id,
            mirroredModelId,
          },
          'Error when uploading Release File to S3.',
        ),
      )
    log.debug({ fileId: file.id, releaseId: release.id, modelId: model.id }, 'Added file to be exported to queue')
  }
}

export async function uploadReleaseImages(
  user: UserInterface,
  model: ModelDoc,
  release: ReleaseDoc,
  mirroredModelId: string,
  queue: PQueue,
) {
  if (Array.isArray(release.images)) {
    for (const image of release.images) {
      const imageLogData = {
        releaseId: release.id,
        sourceModelId: model.id,
        imageName: image.name,
        imageTag: image.tag,
      }
      // update the distributionPackageName to use the mirroredModelId
      const modelIdRe = new RegExp(String.raw`^${model.id}`)
      const distributionPackageName = joinDistributionPackageName({
        domain: '',
        path: image.name.replace(modelIdRe, mirroredModelId),
        tag: image.tag,
      })
      queue
        .add(async () => {
          let tarStream: Pack | undefined,
            gzipStream: zlib.Gzip | undefined,
            uploadStream: PassThrough | undefined,
            uploadPromise: Promise<void> | undefined
          try {
            ;({ tarStream, gzipStream, uploadStream, uploadPromise } = await initialiseTarGzUpload(
              `${image._id.toString()}.tar.gz`,
              {
                exporter: user.dn,
                sourceModelId: model.id,
                mirroredModelId,
                importKind: ImportKind.Image,
                distributionPackageName,
              },
              imageLogData,
            ))

            await addCompressedRegistryImageComponents(user, model.id, distributionPackageName, tarStream, imageLogData)

            await finaliseTarGzUpload(tarStream, uploadPromise)
          } catch (error) {
            // Ensure all streams are destroyed on error to prevent leaks
            tarStream?.destroy(error as Error)
            gzipStream?.destroy(error as Error)
            uploadStream?.destroy(error as Error)
            throw error
          }
        })
        .catch((error) =>
          log.error(
            {
              error,
              modelId: model.id,
              releaseSemver: release.semver,
              distributionPackageName,
              mirroredModelId,
            },
            'Error when uploading Release Image to S3.',
          ),
        )
    }
    log.debug(
      { user, modelId: model.id, semver: release.semver },
      'Finished adding release to tarball file of releases.',
    )
  }
}

async function addReleaseToTarball(
  user: UserInterface,
  model: ModelDoc,
  release: ReleaseDoc,
  tarStream: Pack,
  mirroredModelId: string,
  queue: PQueue,
) {
  log.debug({ user, modelId: model.id, semver: release.semver }, 'Adding release to tarball file of releases.')
  const files: FileWithScanResultsInterface[] = await getFilesByIds(user, release.modelId, release.fileIds)

  try {
    const releaseJson = JSON.stringify(release.toJSON())
    await addEntryToTarGzUpload(
      tarStream,
      { type: 'text', filename: `releases/${release.semver}.json`, content: releaseJson },
      { modelId: model.id },
    )
  } catch (error: unknown) {
    throw InternalError('Error when generating the tarball file.', {
      error,
      modelId: model.id,
      mirroredModelId,
      releaseId: release.id,
    })
  }

  if (files.length > 0) {
    await addFilesToTarball(files, tarStream, model.id)
  }

  // Fire-and-forget upload of artefacts so that the endpoint is able to return without awaiting lots of uploads
  log.debug({ semver: release.semver }, 'Adding files to be exported to queue')
  await uploadReleaseFiles(user, model, release, files, mirroredModelId, queue)
  log.debug({ semver: release.semver }, 'Finished adding files to be exported to queue')
  await uploadReleaseImages(user, model, release, mirroredModelId, queue)
}

async function addFilesToTarball(files: FileWithScanResultsInterface[], tarStream: Pack, modelId: string) {
  for (const file of files) {
    try {
      const fileJson = JSON.stringify(file)
      await addEntryToTarGzUpload(
        tarStream,
        { type: 'text', filename: `files/${file._id.toString()}.json`, content: fileJson },
        { modelId },
      )
    } catch (error: unknown) {
      throw InternalError('Error when generating the tarball file.', { error, modelId, file })
    }
  }
}

async function checkReleaseFiles(user: UserInterface, modelId: string, semvers: string[]) {
  const fileIds = await getAllFileIds(modelId, semvers)
  // Check the total size of the export if more than one release is being exported
  if (semvers.length > 1) {
    if (fileIds.length === 0) {
      return
    }
    const totalFileSize = await getTotalFileSize(fileIds)
    log.debug(
      { modelId, semvers, size: prettyBytes(totalFileSize) },
      'Calculated estimated total file size included in export.',
    )
    if (totalFileSize > config.modelMirror.export.maxSize) {
      throw BadReq('Requested export is too large.', {
        size: totalFileSize,
        maxSize: config.modelMirror.export.maxSize,
      })
    }
  }

  if (scanners.info()) {
    const files = await getFilesByIds(user, modelId, fileIds)
    const scanErrors: {
      missingScan: Array<{ name: string; id: string }>
      incompleteScan: Array<{ name: string; id: string }>
      failedScan: Array<{ name: string; id: string }>
    } = { missingScan: [], incompleteScan: [], failedScan: [] }
    for (const file of files) {
      if (!file.avScan || file.avScan.length === 0) {
        scanErrors.missingScan.push({ name: file.name, id: file.id })
      } else if (file.avScan.some((scanResult) => scanResult.state !== ScanState.Complete)) {
        scanErrors.incompleteScan.push({ name: file.name, id: file.id })
      } else if (file.avScan.some((scanResult) => scanResult.isInfected)) {
        scanErrors.failedScan.push({ name: file.name, id: file.id })
      }
    }
    if (scanErrors.missingScan.length > 0 || scanErrors.incompleteScan.length > 0 || scanErrors.failedScan.length > 0) {
      throw BadReq('The releases contain file(s) that do not have a clean AV scan.', { scanErrors })
    }
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
