import { json } from 'node:stream/consumers'

import { PassThrough } from 'stream'
import { finished } from 'stream/promises'
import { Headers } from 'tar-stream'

import { UserInterface } from '../../../models/User.js'
import { InternalError } from '../../../utils/error.js'
import { hasKeysOfType } from '../../../utils/typeguards.js'
import log from '../../log.js'
import {
  doesImageLayerExist,
  initialiseImageUpload,
  putImageBlob,
  putImageManifest,
  splitDistributionPackageName,
} from '../../registry.js'
import { ImageExportMetadata, ImageImportInformation, ImportKind } from '../mirroredModel.js'
import { BaseImporter } from './baseImporter.js'

const manifestRegex = /^manifest\.json$/
const blobRegex = /^blobs\/sha256\/[0-9a-f]{64}$/

export class ImageImporter extends BaseImporter {
  declare metadata: ImageExportMetadata

  user: UserInterface
  imageName: string
  imageTag: string
  manifestBody: unknown = null

  constructor(user: UserInterface, metadata: ImageExportMetadata, logData?: Record<string, unknown>) {
    super(metadata, logData)
    if (this.metadata.importKind !== ImportKind.Image) {
      throw InternalError('Cannot parse compressed Image: incorrect metadata specified.', {
        metadata: this.metadata,
        ...this.logData,
      })
    }

    this.user = user
    const distributionPackageNameObject = splitDistributionPackageName(this.metadata.distributionPackageName)
    if (!('tag' in distributionPackageNameObject)) {
      throw InternalError('Distribution Package Name must include a tag.', {
        distributionPackageNameObject,
        distributionPackageName: this.metadata.distributionPackageName,
      })
    }
    ;({ path: this.imageName, tag: this.imageTag } = distributionPackageNameObject)
  }

  async processEntry(entry: Headers, stream: PassThrough) {
    if (this.metadata.importKind !== ImportKind.Image) {
      throw InternalError('Cannot parse compressed Image: incorrect metadata specified.', {
        metadata: this.metadata,
        ...this.logData,
      })
    }

    if (entry.type === 'file') {
      // Process file
      if (manifestRegex.test(entry.name)) {
        // manifest.json must be uploaded after the other layers otherwise the registry will error as the referenced layers won't yet exist
        log.debug({ ...this.logData }, 'Extracting un-tarred manifest.')
        this.manifestBody = await json(stream)
      } else if (blobRegex.test(entry.name)) {
        // convert filename to digest format
        const layerDigest = `${entry.name.replace(/^(blobs\/sha256\/)/, 'sha256:')}`
        try {
          if (await doesImageLayerExist(this.user, this.metadata.mirroredModelId, this.imageName, layerDigest)) {
            log.debug(
              {
                name: entry.name,
                size: entry.size,
                ...this.logData,
              },
              'Skipping blob as it already exists in the registry.',
            )

            // auto-drain the stream
            stream.resume()
          } else {
            log.debug(
              {
                name: entry.name,
                size: entry.size,
                ...this.logData,
              },
              'Initiating un-tarred blob upload.',
            )
            const res = await initialiseImageUpload(this.user, this.metadata.mirroredModelId, this.imageName)

            await putImageBlob(
              this.user,
              this.metadata.mirroredModelId,
              this.imageName,
              res.location,
              layerDigest,
              stream,
              String(entry.size),
            )
            await finished(stream)
          }
        } catch (err) {
          throw InternalError('Failed to upload blob to registry.', {
            err,
            name: entry.name,
            size: entry.size,
            ...this.logData,
          })
        }
      } else {
        throw InternalError('Cannot parse compressed image: unrecognised contents.', { ...this.logData })
      }
    } else {
      // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
      log.warn({ name: entry.name, type: entry.type, ...this.logData }, 'Skipping non-file entry.')
    }
  }

  async finishListener(
    resolve: (reason?: ImageImportInformation) => void,
    reject: (reason?: unknown) => void,
    _logData?: Record<string, unknown>,
  ) {
    log.debug({ ...this.logData }, 'Uploading manifest.')
    if (hasKeysOfType<{ mediaType: 'string' }>(this.manifestBody, { mediaType: 'string' })) {
      await putImageManifest(
        this.user,
        this.metadata.mirroredModelId,
        this.imageName,
        this.imageTag,
        JSON.stringify(this.manifestBody),
        this.manifestBody['mediaType'],
      )
      log.debug(
        {
          image: { modelId: this.metadata.mirroredModelId, imageName: this.imageName, imageTag: this.imageTag },
          ...this.logData,
        },
        'Completed registry upload',
      )

      resolve({
        metadata: this.metadata,
        image: { modelId: this.metadata.mirroredModelId, imageName: this.imageName, imageTag: this.imageTag },
      })
    } else {
      reject(InternalError('Manifest file (manifest.json) missing or invalid in Tarball file.'))
    }
  }
}
