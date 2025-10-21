import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'

import fetch, { Response } from 'node-fetch'
import { Pack } from 'tar-stream'

import { DocumentsExporter } from '../../connectors/mirroredModel/exporters/documents.js'
import { FileExporter } from '../../connectors/mirroredModel/exporters/file.js'
import { ImageExporter } from '../../connectors/mirroredModel/exporters/image.js'
import { exportQueue } from '../../connectors/mirroredModel/exporters/index.js'
import { MongoDocumentMirrorInformation } from '../../connectors/mirroredModel/importers/documents.js'
import { FileMirrorInformation } from '../../connectors/mirroredModel/importers/file.js'
import { ImageMirrorInformation } from '../../connectors/mirroredModel/importers/image.js'
import { ModelDoc, ModelInterface } from '../../models/Model.js'
import { ReleaseDoc } from '../../models/Release.js'
import { UserInterface } from '../../models/User.js'
import config from '../../utils/config.js'
import { BadReq, InternalError } from '../../utils/error.js'
import { shortId } from '../../utils/id.js'
import { getHttpsAgent } from '../http.js'
import log from '../log.js'
import { getModelById } from '../model.js'
import { getImageBlob, getImageManifest, splitDistributionPackageName } from '../registry.js'
import { addEntryToTarGzUpload, extractTarGzStream } from './tarball.js'

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

  const documentsExporter = new DocumentsExporter(user, modelId, semvers, {
    exportId,
    sourceModelId: modelId,
    semvers,
  })
  await documentsExporter.init()

  const model = documentsExporter.getModel()!
  const mirroredModelId = model.settings.mirror.destinationModelId
  const releases = documentsExporter.getReleases()
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

      for (const release of releases) {
        uploadReleaseFiles(user, model!, release, documentsExporter.getFiles()!, { exportId })
        uploadReleaseImages(user, model!, release, release.images, { exportId })
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
    const { stream: responseStream, abort } = await getImageBlob(user, modelId, imageName, layerDigest)

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

export async function uploadReleaseFiles(
  user: UserInterface,
  model: ModelDoc,
  release: ReleaseDoc,
  files,
  logData?: Record<string, unknown>,
) {
  for (const file of files) {
    // Not `await`ed for fire-and-forget approach
    exportQueue
      .add(async () => {
        const fileExporter = new FileExporter(user, model, file, logData)
        await fileExporter.init()
        await fileExporter.addData()
        await fileExporter.finalise()
      })
      .catch((error) => {
        log.error(
          {
            error,
            modelId: model.id,
            mirroredModelId: model.settings.mirror.destinationModelId,
            release: release.semver,
            fileId: file.id,
            fileName: file.name,
            ...logData,
          },
          'Error when exporting mirrored File.',
        )
      })
  }
}

export async function uploadReleaseImages(
  user: UserInterface,
  model: ModelDoc,
  release: ReleaseDoc,
  images: ReleaseDoc['images'],
  logData?: Record<string, unknown>,
) {
  for (const image of images) {
    exportQueue
      .add(async () => {
        const imageExporter = new ImageExporter(user, model, release, image, logData)
        await imageExporter.init()
        await imageExporter.addData()
        await imageExporter.finalise()
      })
      .catch((error) => {
        log.error(
          {
            error,
            modelId: model.id,
            mirroredModelId: model.settings.mirror.destinationModelId,
            release: release.semver,
            imageId: image._id.toString(),
            imageName: image.name,
            imageTag: image.tag,
            ...logData,
          },
          'Error when exporting mirrored Image.',
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
