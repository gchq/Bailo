import { createHash } from 'node:crypto'
import { json } from 'node:stream/consumers'
import zlib from 'node:zlib'

import archiver from 'archiver'
import { ObjectId } from 'mongoose'
import fetch, { Response } from 'node-fetch'
import prettyBytes from 'pretty-bytes'
import stream, { PassThrough, Readable, Writable } from 'stream'
import { finished } from 'stream/promises'
import { ReadableStream } from 'stream/web'
import { extract, pack } from 'tar-stream'
import * as unzipper from 'unzipper'

import { objectExists, putObjectStream } from '../clients/s3.js'
import { ModelAction, ReleaseAction } from '../connectors/authorisation/actions.js'
import authorisation from '../connectors/authorisation/index.js'
import { ScanState } from '../connectors/fileScanning/Base.js'
import scanners from '../connectors/fileScanning/index.js'
import { FileWithScanResultsInterface } from '../models/File.js'
import { ModelDoc, ModelInterface } from '../models/Model.js'
import { ModelCardRevisionDoc } from '../models/ModelCardRevision.js'
import { ReleaseDoc } from '../models/Release.js'
import { UserInterface } from '../models/User.js'
import config from '../utils/config.js'
import { BadReq, Forbidden, InternalError } from '../utils/error.js'
import { shortId } from '../utils/id.js'
import { hasKeysOfType } from '../utils/typeguards.js'
import {
  createFilePath,
  downloadFile,
  getFilesByIds,
  getTotalFileSize,
  isFileInterfaceDoc,
  markFileAsCompleteAfterImport,
  saveImportedFile,
} from './file.js'
import { getHttpsAgent } from './http.js'
import log from './log.js'
import {
  getModelById,
  getModelCardRevisions,
  isModelCardRevisionDoc,
  saveImportedModelCard,
  setLatestImportedModelCard,
  validateMirroredModel,
} from './model.js'
import {
  DistributionPackageName,
  doesImageLayerExist,
  getImageBlob,
  getImageManifest,
  initialiseImageUpload,
  joinDistributionPackageName,
  putImageBlob,
  putImageManifest,
  splitDistributionPackageName,
} from './registry.js'
import { getAllFileIds, getReleasesForExport, isReleaseDoc, saveImportedRelease } from './release.js'
import { uploadToS3 } from './s3.js'

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

  const zip = archiver('zip')
  const s3Stream = new PassThrough()
  zip.pipe(s3Stream)

  await uploadToS3(
    `${modelId}.zip`,
    s3Stream,
    { exporter: user.dn, sourceModelId: modelId, mirroredModelId, importKind: ImportKind.Documents },
    { semvers },
  )

  try {
    await addModelCardRevisionsToZip(user, model, zip)
  } catch (error) {
    throw InternalError('Error when adding the model card revision(s) to the zip file.', { error })
  }
  try {
    if (releases.length > 0) {
      await addReleasesToZip(user, model, releases, zip, mirroredModelId)
    }
  } catch (error) {
    throw InternalError('Error when adding the release(s) to the zip file.', { error })
  }

  zip.finalize()
  log.debug({ modelId, semvers }, 'Successfully finalized zip file.')
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
  | { importKind: ImportKindKeys<'Image'>; imageName: string; imageTag: string }
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
    throw Forbidden(auth.info, { userDn: user.dn, modelId: mirroredModel.id, importId })
  }

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

  log.info({ mirroredModelId, payloadUrl, importId }, 'Obtained the file from the payload URL.')

  switch (importKind) {
    case ImportKind.Documents: {
      log.info({ mirroredModelId, payloadUrl, importId }, 'Importing collection of documents.')
      return await importDocuments(user, responseBody, mirroredModelId, sourceModelId, payloadUrl, importId)
    }
    case ImportKind.File: {
      log.info({ mirroredModelId, payloadUrl }, 'Importing file data.')
      if (!fileId) {
        throw BadReq('Missing File ID.', { mirroredModelId, sourceModelIdMeta: sourceModelId })
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
      log.info({ mirroredModelId, payloadUrl }, 'Importing image data.')
      if (!distributionPackageName) {
        throw BadReq('Missing Distribution Package Name.', { mirroredModelId, sourceModelIdMeta: sourceModelId })
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
      throw BadReq('Unrecognised import kind', { importKind, importId })
  }
}

export async function exportCompressedRegistryImage(
  user: UserInterface,
  modelId: string,
  distributionPackageName: string,
  metadata: ExportMetadata,
  logData?: Record<string, unknown>,
) {
  const distributionPackageNameObject = splitDistributionPackageName(distributionPackageName)
  if (!('tag' in distributionPackageNameObject)) {
    throw InternalError('Could not get tag from Distribution Package Name.', {
      distributionPackageNameObject,
      distributionPackageName,
    })
  }
  const { path: imageName, tag: imageTag } = distributionPackageNameObject
  // get which layers exist for the model
  const tagManifest = await getImageManifest(user, modelId, imageName, imageTag)
  log.debug('Got image tag manifest', {
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
  })

  // setup gzip, stream to s3 to allow draining, and then pipe tar to gzip
  const gzipStream = zlib.createGzip({ chunkSize: 16 * 1024 * 1024, level: zlib.constants.Z_BEST_SPEED })
  const s3Upload = uploadToS3(`${distributionPackageName}.tar.gz`, gzipStream, metadata, logData)
  const packerStream = pack()

  try {
    packerStream.pipe(gzipStream)

    // upload the manifest first as this is the starting point when later importing the blob
    const tagManifestJson = JSON.stringify(tagManifest)
    const packerEntry = packerStream.entry({ name: 'manifest.json', size: tagManifestJson.length })
    await pipeStreamToTarEntry(Readable.from(tagManifestJson), packerEntry, { mediaType: tagManifest.mediaType })

    // fetch and compress one layer (including config) at a time to manage RAM usage
    // also, tar can only handle one pipe at a time
    for (const layer of [tagManifest.config, ...tagManifest.layers]) {
      const layerDigest = layer['digest']
      if (!layerDigest || layerDigest.length === 0) {
        throw InternalError('Could not extract layer digest.', { layer, modelId, imageName, imageTag, ...logData })
      }

      log.debug('Fetching image layer', {
        modelId,
        imageName,
        imageTag,
        layerDigest,
        ...logData,
      })
      const imageBlobResponse = await getImageBlob(user, modelId, imageName, layerDigest)
      const imageBlobReadable =
        imageBlobResponse.body instanceof Readable ? imageBlobResponse.body : Readable.fromWeb(imageBlobResponse.body)

      // pipe the body to tar using streams
      const entryName = `blobs/sha256/${layerDigest.replace(/^(sha256:)/, '')}`
      const packerEntry = packerStream.entry({ name: entryName, size: layer.size })
      // it's only possible to process one stream at a time as per https://github.com/mafintosh/tar-stream/issues/24
      await pipeStreamToTarEntry(imageBlobReadable, packerEntry, {
        layerDigest,
        mediaType: layer.mediaType,
      })
    }
    // no more data to write
    packerStream.finalize()

    await s3Upload
  } catch (err) {
    gzipStream.destroy()
    packerStream.destroy()
    throw err
  }
}

export async function pipeStreamToTarEntry(
  inputStream: Readable,
  packerEntry: Writable,
  logData: { [key: string]: string } = {},
) {
  return new Promise((resolve, reject) => {
    const onError = (err: any) => {
      inputStream.destroy()
      packerEntry.destroy()
      reject(
        InternalError('Stream error during tar operation', {
          error: err,
          ...logData,
        }),
      )
    }
    inputStream.pipe(packerEntry)
    packerEntry.on('finish', () => {
      log.debug('Finished fetching layer stream', { ...logData })
      resolve('ok')
    })
    packerEntry.on('error', onError)
    inputStream.on('error', onError)
  })
}

export async function importCompressedRegistryImage(
  user: UserInterface,
  body: Readable,
  modelId: string,
  distributionPackageName: string,
  importId: string,
) {
  const distributionPackageNameObject = splitDistributionPackageName(distributionPackageName)
  if (!('tag' in distributionPackageNameObject)) {
    throw InternalError('Could not get tag from Distribution Package Name.', {
      distributionPackageNameObject,
      distributionPackageName,
    })
  }
  const { path: imageName, tag: imageTag } = distributionPackageNameObject

  // setup streams
  const gzipStream = zlib.createGunzip({ chunkSize: 16 * 1024 * 1024 })
  const tarStream = extract()
  try {
    // body is tar.gz blob stream
    body.pipe(gzipStream).pipe(tarStream)

    let manifestBody: unknown
    await new Promise((resolve, reject) => {
      tarStream.on('entry', async function (entry, stream, next) {
        log.debug('Processing un-tarred entry', {
          name: entry.name,
          type: entry.type,
          size: entry.size,
          importId,
        })

        if (entry.type === 'file') {
          // Process file
          if (entry.name === 'manifest.json') {
            // manifest.json must be uploaded after the other layers otherwise the registry will error as the referenced layers won't yet exist
            log.debug('Extracting un-tarred manifest', { importId })
            manifestBody = await json(stream)

            next()
          } else {
            // convert filename to digest format
            const layerDigest = `${entry.name.replace(/^(blobs\/sha256\/)/, 'sha256:')}`
            if (await doesImageLayerExist(user, modelId, imageName, layerDigest)) {
              log.debug('Skipping blob as it already exists in the registry', {
                name: entry.name,
                size: entry.size,
                importId,
              })

              // auto-drain the stream
              stream.resume()
              next()
            } else {
              log.debug('Initiating un-tarred blob upload', {
                name: entry.name,
                size: entry.size,
                importId,
              })
              const res = await initialiseImageUpload(user, modelId, imageName)

              await putImageBlob(user, modelId, imageName, res.location, layerDigest, stream, String(entry.size))
              await finished(stream)
              next()
            }
          }
        } else {
          // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
          log.warn('Skipping non-file entry', { name: entry.name, type: entry.type, importId })
          next()
        }
      })

      tarStream.on('error', (err) =>
        reject(
          InternalError('Error while un-tarring blob', {
            error: err,
          }),
        ),
      )

      tarStream.on('finish', async function () {
        log.debug('Uploading manifest', { importId })
        if (hasKeysOfType<{ mediaType: 'string' }>(manifestBody, { mediaType: 'string' })) {
          await putImageManifest(
            user,
            modelId,
            imageName,
            imageTag,
            JSON.stringify(manifestBody),
            manifestBody['mediaType'],
          )
          resolve('ok')
        } else {
          reject(InternalError('Could not find manifest.json in tarball'))
        }
      })
    })
    log.debug('Completed registry upload', {
      image: { modelId, imageName, imageTag },
      importId,
    })

    return { image: { modelId, imageName, imageTag } }
  } catch (err) {
    body.destroy()
    gzipStream.destroy()
    tarStream.destroy()
    throw err
  }
}

async function importDocuments(
  user: UserInterface,
  body: Readable,
  mirroredModelId: string,
  sourceModelId: string,
  payloadUrl: string,
  importId: string,
) {
  const modelCardRegex = /^[0-9]+\.json$/
  const releaseRegex = /^releases\/(.*)\.json$/
  const fileRegex = /^files\/(.*)\.json$/

  const modelCardVersions: number[] = []
  const releaseSemvers: string[] = []
  const fileIds: ObjectId[] = []
  const imageIds: string[] = []
  const newModelCards: Omit<ModelCardRevisionDoc, '_id'>[] = []
  const newReleases: Omit<ReleaseDoc, '_id'>[] = []

  log.debug('Parsing zip file', { importId })
  // Parse zip entries one by one
  for await (const entry of body.pipe(unzipper.Parse({ forceStream: true }))) {
    const { path: key, type } = entry
    if (type !== 'File') {
      // skip directories etc.
      entry.autodrain()
      continue
    }
    log.debug('Found zipped file', { key, importId })

    let fileContents = ''
    for await (const chunk of entry) {
      fileContents += chunk.toString('utf8')
    }

    // enable lazy fetching
    let lazyMirroredModel: ModelDoc | null = null

    try {
      if (modelCardRegex.test(key)) {
        log.debug('Processing zipped file as a Model Card', { key, importId })
        const modelCard = parseModelCard(fileContents, mirroredModelId, sourceModelId, importId)
        modelCardVersions.push(modelCard.version)
        const savedModelCard = await saveImportedModelCard(modelCard)
        if (savedModelCard) {
          newModelCards.push(savedModelCard)
        }
      } else if (releaseRegex.test(key)) {
        log.debug('Processing zipped file as a Release', { key, importId })
        const release = parseRelease(fileContents, mirroredModelId, sourceModelId, importId)

        // have to authorise per-release due to streaming, rather than all releases at once
        if (!lazyMirroredModel) {
          lazyMirroredModel = await getModelById(user, mirroredModelId)
        }
        const authResponse = await authorisation.releases(user, lazyMirroredModel, [release], ReleaseAction.Import)
        if (!authResponse[0]?.success) {
          throw Forbidden('You do not have the necessary permissions to import these releases.', {
            modelId: mirroredModelId,
            release: release.semver,
            user,
            importId,
          })
        }

        for (const image of release.images) {
          imageIds.push(
            joinDistributionPackageName({
              domain: image.repository,
              path: image.name,
              tag: image.tag,
            } as DistributionPackageName),
          )
        }
        releaseSemvers.push(release.semver)
        const savedRelease = await saveImportedRelease(release)
        if (savedRelease) {
          newReleases.push(savedRelease)
        }
      } else if (fileRegex.test(key)) {
        log.debug('Processing zipped file as a File', { key, importId })
        const file = await parseFile(fileContents, mirroredModelId, sourceModelId, importId)
        fileIds.push(file._id)
        await saveImportedFile(file)
      } else {
        throw InternalError('Failed to parse zip file - Unrecognised file contents.', { mirroredModelId, importId })
      }
    } catch (err) {
      log.error('Error processing zipped document', { err, mirroredModelId, importId })
      throw err
    }
  }
  log.debug('Finished processing zipped file', { importId })

  const updatedMirroredModel = await setLatestImportedModelCard(mirroredModelId)

  log.info('Finished importing the collection of model documents.', {
    mirroredModelId,
    payloadUrl,
    sourceModelId,
    modelCardVersions,
    releaseSemvers,
    fileIds,
    imageIds,
    numberOfDocuments: {
      modelCards: newModelCards.length,
      releases: newReleases.length,
      files: fileIds.length,
      images: imageIds.length,
    },
    importId,
  })

  return {
    mirroredModel: updatedMirroredModel,
    importResult: {
      modelCardVersions,
      newModelCards,
      releaseSemvers,
      newReleases,
      fileIds,
      imageIds,
    },
  }
}

async function importModelFile(body: Readable, fileId: string, mirroredModelId: string, importId: string) {
  const bucket = config.s3.buckets.uploads
  const updatedPath = createFilePath(mirroredModelId, fileId)
  await putObjectStream(updatedPath, body, bucket)
  log.debug({ bucket, path: updatedPath, importId }, 'Imported file successfully uploaded to S3.')
  await markFileAsCompleteAfterImport(updatedPath)
  return { sourcePath: fileId, newPath: updatedPath }
}

function parseModelCard(
  modelCardJson: string,
  mirroredModelId: string,
  sourceModelId: string,
  importId: string,
): Omit<ModelCardRevisionDoc, '_id'> {
  const modelCard = JSON.parse(modelCardJson)
  if (!isModelCardRevisionDoc(modelCard)) {
    throw InternalError('Data cannot be converted into a model card.', {
      modelCard,
      mirroredModelId,
      sourceModelId,
      importId,
    })
  }
  const modelId = modelCard.modelId
  modelCard.modelId = mirroredModelId
  delete modelCard._id
  if (sourceModelId !== modelId) {
    throw InternalError('Zip file contains model cards that have a model ID that does not match the source model Id.', {
      modelId,
      sourceModelId,
      importId,
    })
  }
  return modelCard
}

function parseRelease(
  releaseJson: string,
  mirroredModelId: string,
  sourceModelId: string,
  importId: string,
): Omit<ReleaseDoc, '_id'> {
  const release = JSON.parse(releaseJson)
  if (!isReleaseDoc(release)) {
    throw InternalError('Data cannot be converted into a release.', {
      release,
      mirroredModelId,
      sourceModelId,
      importId,
    })
  }

  const modelId = release.modelId
  release.modelId = mirroredModelId
  delete release._id

  if (sourceModelId !== modelId) {
    throw InternalError('Zip file contains releases that have a model ID that does not match the source model Id.', {
      release,
      mirroredModelId,
      sourceModelId,
      importId,
    })
  }

  return release
}

async function parseFile(fileJson: string, mirroredModelId: string, sourceModelId: string, importId: string) {
  const file = JSON.parse(fileJson)
  if (!isFileInterfaceDoc(file)) {
    throw InternalError('Data cannot be converted into a file.', { file, mirroredModelId, sourceModelId, importId })
  }

  file.path = createFilePath(mirroredModelId, file.id)

  try {
    file.complete = await objectExists(file.path)
  } catch (error) {
    throw InternalError('Failed to check if file exists.', {
      path: file.path,
      mirroredModelId,
      sourceModelId,
      error,
      importId,
    })
  }

  const modelId = file.modelId
  if (sourceModelId !== modelId) {
    throw InternalError('Zip file contains files that have a model ID that does not match the source model Id.', {
      file,
      mirroredModelId,
      sourceModelId,
      importId,
    })
  }
  file.modelId = mirroredModelId

  return file
}

async function addModelCardRevisionsToZip(user: UserInterface, model: ModelDoc, zip: archiver.Archiver) {
  log.debug({ user, modelId: model.id }, 'Generating zip file of model card revisions.')
  const cards = await getModelCardRevisions(user, model.id)
  for (const card of cards) {
    zip.append(JSON.stringify(card.toJSON()), { name: `${card.version}.json` })
  }
  log.debug({ user, modelId: model.id }, 'Finished generating zip file of model card revisions.')
}

async function addReleasesToZip(
  user: UserInterface,
  model: ModelDoc,
  releases: ReleaseDoc[],
  zip: archiver.Archiver,
  mirroredModelId: string,
) {
  const semvers = releases.map((release) => release.semver)
  log.debug({ user, modelId: model.id, semvers }, 'Adding releases to zip file')

  const errors: any[] = []
  // Using a .catch here to ensure all errors are returned, rather than just the first error.
  await Promise.all(
    releases.map((release) => addReleaseToZip(user, model, release, zip, mirroredModelId).catch((e) => errors.push(e))),
  )
  if (errors.length > 0) {
    throw InternalError('Error when generating the release zip file.', { errors, errorsString: JSON.stringify(errors) })
  }
  log.debug({ user, modelId: model.id, semvers }, 'Completed generating zip file of releases.')
  return zip
}

async function addReleaseToZip(
  user: UserInterface,
  model: ModelDoc,
  release: ReleaseDoc,
  zip: archiver.Archiver,
  mirroredModelId: string,
) {
  log.debug('Adding release to zip file of releases.', { user, modelId: model.id, semver: release.semver })
  const files: FileWithScanResultsInterface[] = await getFilesByIds(user, release.modelId, release.fileIds)

  try {
    zip.append(JSON.stringify(release.toJSON()), { name: `releases/${release.semver}.json` })
    for (const file of files) {
      zip.append(JSON.stringify(file), { name: `files/${file._id.toString()}.json` })
      await uploadToS3(
        file.id,
        (await downloadFile(user, file.id)).Body as stream.Readable,
        {
          exporter: user.dn,
          sourceModelId: model.id,
          mirroredModelId,
          filePath: file.id,
          importKind: ImportKind.File,
        },
        {
          releaseId: release.id,
          fileId: file.id,
        },
      )
    }

    if (Array.isArray(release.images)) {
      for (const image of release.images) {
        const imageLogData = {
          releaseId: release.id,
          sourceModelId: model.id,
          imageName: image.name,
          imageTag: image.tag,
        }
        const distributionPackageName = joinDistributionPackageName({
          domain: image.repository,
          path: image.name,
          tag: image.tag,
        })

        await exportCompressedRegistryImage(
          user,
          model.id,
          distributionPackageName,
          {
            exporter: user.dn,
            sourceModelId: model.id,
            mirroredModelId,
            importKind: ImportKind.Image,
            imageName: image.name,
            imageTag: image.tag,
          },
          imageLogData,
        )
      }
    }
  } catch (error: any) {
    throw InternalError('Error when generating the zip file.', { error })
  }
  log.debug({ user, modelId: model.id, semver: release.semver }, 'Finished adding release to zip file of releases.')
  return zip
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
  const hash = createHash('sha256')
  try {
    hash.setEncoding('hex')
    file.pipe(hash)
    messageDigest = await new Promise((resolve) =>
      file.on('end', () => {
        hash.end()
        resolve(hash.read())
      }),
    )
    return messageDigest
  } catch (error: any) {
    file.destroy()
    throw InternalError('Error when generating the digest for the zip file.', { error })
  }
}
