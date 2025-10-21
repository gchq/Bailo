import { json } from 'node:stream/consumers'

import { PassThrough } from 'stream'
import { finished } from 'stream/promises'
import { Headers } from 'tar-stream'

import { ModelDoc } from '../../models/Model.js'
import { ReleaseDoc } from '../../models/Release.js'
import { UserInterface } from '../../models/User.js'
import log from '../../services/log.js'
import { addCompressedRegistryImageComponents } from '../../services/mirroredModel/mirroredModel.js'
import { initialiseTarGzUpload } from '../../services/mirroredModel/tarball.js'
import {
  doesImageLayerExist,
  initialiseImageUpload,
  joinDistributionPackageName,
  putImageBlob,
  putImageManifest,
  splitDistributionPackageName,
} from '../../services/registry.js'
import { getReleaseBySemver } from '../../services/release.js'
import config from '../../utils/config.js'
import { Forbidden, InternalError } from '../../utils/error.js'
import { hasKeysOfType } from '../../utils/typeguards.js'
import { ReleaseAction } from '../authorisation/actions.js'
import authorisation from '../authorisation/index.js'
import { BaseExporter, BaseImporter, BaseMirrorMetadata, requiresInit } from './base.js'
import { MirrorKind, MirrorKindKeys } from './index.js'

export type ImageMirrorMetadata = BaseMirrorMetadata & {
  importKind: MirrorKindKeys<'Image'>
  distributionPackageName: string
}
export type ImageMirrorInformation = {
  metadata: ImageMirrorMetadata
  image: { modelId: string; imageName: string; imageTag: string }
}

export class ImageExporter extends BaseExporter {
  protected readonly semver: string
  protected release: ReleaseDoc | undefined
  protected readonly imageId: string
  protected image: ReleaseDoc['images'][number] | undefined
  protected distributionPackageName: string | undefined

  constructor(
    user: UserInterface,
    model: string | ModelDoc,
    release: string | ReleaseDoc,
    image: string | ReleaseDoc['images'][number],
    logData?: Record<string, unknown>,
  ) {
    super(user, model, logData)

    if (typeof release === 'string') {
      this.semver = release
    } else {
      this.release = release
      this.semver = this.release.semver
    }
    if (typeof image === 'string') {
      this.imageId = image
    } else {
      this.image = image
      this.imageId = this.image._id.toString()
    }
  }

  getRelease() {
    return this.release
  }

  getImage() {
    return this.image
  }

  getDistributionPackageName() {
    return this.distributionPackageName
  }

  async _init() {
    await super._init()

    if (!this.release) {
      this.release = await getReleaseBySemver(this.user, this.model!, this.semver)
    }
    const releaseAuth = await authorisation.release(this.user, this.model!, ReleaseAction.View, this.release)
    if (!releaseAuth.success) {
      throw Forbidden(releaseAuth.info, {
        userDn: this.user.dn,
        modelId: this.modelId,
        semver: this.semver,
        ...this.logData,
      })
    }

    if (!this.image) {
      this.image = this.release.images.find((image) => image._id.toString() === this.imageId)
      if (!this.image) {
        throw InternalError('Could not find image associated with release.', {
          modelId: this.modelId,
          semver: this.semver,
          imageId: this.imageId,
          ...this.logData,
        })
      }
    }
    const imageAuth = await authorisation.image(this.user, this.model!, {
      type: 'repository',
      name: this.modelId,
      actions: ['pull'],
    })
    if (!imageAuth.success) {
      throw Forbidden(imageAuth.info, {
        userDn: this.user.dn,
        modelId: this.modelId,
        semver: this.semver,
        imageId: this.imageId,
        ...this.logData,
      })
    }

    // update the distributionPackageName to use the mirroredModelId
    const modelIdRe = new RegExp(String.raw`^${this.modelId}`)
    this.distributionPackageName = joinDistributionPackageName({
      domain: '',
      path: this.image.name.replace(modelIdRe, this.model!.settings.mirror.destinationModelId!),
      tag: this.image.tag,
    })
  }

  protected getInitialiseTarGzUploadParams(): Parameters<typeof initialiseTarGzUpload> {
    if (!this.model) {
      throw InternalError('Method `getInitialiseTarGzUploadParams` called before `this.model` defined.', {
        ...this.logData,
      })
    }
    if (!this.distributionPackageName) {
      throw InternalError(
        'Method `getInitialiseTarGzUploadParams` called before `this.distributionPackageName` defined.',
        {
          ...this.logData,
        },
      )
    }
    return [
      `${this.imageId}.tar.gz`,
      {
        exporter: this.user.dn,
        sourceModelId: this.modelId,
        mirroredModelId: this.model!.settings.mirror.destinationModelId!,
        distributionPackageName: this.distributionPackageName!,
        importKind: MirrorKind.Image,
      },
      this.logData,
    ]
  }

  @requiresInit
  async addData() {
    // Non-null assertion operator used due to `requiresInit` performing assertion
    await addCompressedRegistryImageComponents(
      this.user,
      this.modelId,
      this.distributionPackageName!,
      this.tarStream!,
      this.logData,
    )
  }
}

export class ImageImporter extends BaseImporter {
  declare protected metadata: ImageMirrorMetadata

  protected user: UserInterface
  protected imageName: string
  protected imageTag: string
  protected manifestBody: unknown = null

  protected manifestRegex = new RegExp(String.raw`^${config.modelMirror.contentDirectory}/manifest\.json$`)
  protected blobRegex = new RegExp(String.raw`^${config.modelMirror.contentDirectory}/blobs\/sha256\/[0-9a-f]{64}$`)

  constructor(user: UserInterface, metadata: ImageMirrorMetadata, logData?: Record<string, unknown>) {
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
      })
    }
    ;({ path: this.imageName, tag: this.imageTag } = distributionPackageNameObject)
  }

  async processEntry(entry: Headers, stream: PassThrough) {
    if (entry.type === 'file') {
      // Process file
      if (this.manifestRegex.test(entry.name)) {
        // manifest.json must be uploaded after the other layers otherwise the registry will error as the referenced layers won't yet exist
        log.debug({ ...this.logData }, 'Extracting un-tarred manifest.')
        this.manifestBody = await json(stream)
      } else if (this.blobRegex.test(entry.name)) {
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
    resolve: (reason?: ImageMirrorInformation) => void,
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
