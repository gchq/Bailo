import { PassThrough } from 'node:stream'
import { json } from 'node:stream/consumers'

import { escapeRegExp } from 'lodash-es'
import { finished } from 'stream/promises'
import { Headers } from 'tar-stream'

import { UserInterface } from '../../../models/User.js'
import config from '../../../utils/config.js'
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
import { MirrorKind, MirrorKindKeys } from '../index.js'
import { MirrorLogData } from '../mirroredModel.js'
import { BaseImporter, BaseMirrorMetadata } from './base.js'

export type ImageMirrorMetadata = BaseMirrorMetadata & {
  importKind: MirrorKindKeys<'Image'>
  distributionPackageName: string
}
export type ImageMirrorInformation = {
  metadata: ImageMirrorMetadata
  image: { modelId: string; imageName: string; imageTag: string }
}

export class ImageImporter extends BaseImporter {
  declare protected readonly metadata: ImageMirrorMetadata

  protected readonly user: UserInterface
  protected readonly imageName: string
  protected readonly imageTag: string
  protected manifestBody: unknown = null

  static readonly manifestRegex = new RegExp(
    String.raw`^${escapeRegExp(config.modelMirror.contentDirectory)}/manifest\.json$`,
  )
  static readonly blobRegex = new RegExp(
    String.raw`^${escapeRegExp(config.modelMirror.contentDirectory)}/blobs\/sha256\/[0-9a-f]{64}$`,
  )

  constructor(user: UserInterface, metadata: ImageMirrorMetadata, logData: MirrorLogData) {
    super(metadata, logData)
    if (this.metadata.importKind !== MirrorKind.Image) {
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
        metadata: this.metadata,
        ...this.logData,
      })
    }
    ;({ path: this.imageName, tag: this.imageTag } = distributionPackageNameObject)
  }

  async processEntry(entry: Headers, stream: PassThrough) {
    if (entry.type === 'file') {
      // Process file
      if (ImageImporter.manifestRegex.test(entry.name)) {
        // manifest.json must be uploaded after the other layers otherwise the registry will error as the referenced layers won't yet exist
        log.debug({ ...this.logData }, 'Extracting un-tarred manifest.')
        this.manifestBody = await json(stream)
      } else if (ImageImporter.blobRegex.test(entry.name)) {
        // convert filename to digest format
        const layerDigest = `${entry.name.replace(new RegExp(String.raw`^(${config.modelMirror.contentDirectory}/blobs\/sha256\/)`), 'sha256:')}`
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

            log.debug(
              {
                name: entry.name,
                size: entry.size,
                ...this.logData,
              },
              'Putting image blob.',
            )
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
            metadata: this.metadata,
            ...this.logData,
          })
        }
      } else {
        throw InternalError('Cannot parse compressed image: unrecognised contents.', {
          metadata: this.metadata,
          ...this.logData,
        })
      }
    } else {
      // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
      log.warn({ name: entry.name, type: entry.type, ...this.logData }, 'Skipping non-file entry.')
    }
  }

  async finishListener(resolve: (reason?: ImageMirrorInformation) => void, reject: (reason?: unknown) => void) {
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
      reject(
        InternalError('Manifest file (manifest.json) missing or invalid in Tarball file.', {
          metadata: this.metadata,
          ...this.logData,
        }),
      )
    }
  }
}
