import { PassThrough } from 'node:stream'
import { json } from 'node:stream/consumers'

import { escapeRegExp } from 'lodash-es'
import { finished } from 'stream/promises'
import { Headers } from 'tar-stream'

import { doesLayerExist, initialiseUpload, putManifest, uploadLayerMonolithic } from '../../../clients/registry.js'
import { UserInterface } from '../../../models/User.js'
import { issueAccessToken } from '../../../routes/v1/registryAuth.js'
import { MirrorImportLogData, MirrorKind, MirrorKindKeys } from '../../../types/types.js'
import config from '../../../utils/config.js'
import { InternalError } from '../../../utils/error.js'
import { ImageManifestV2, ImageManifestV2Schema, OCIEmptyMediaType } from '../../../utils/registryResponses.js'
import log from '../../log.js'
import { parseManifestFilePath, splitDistributionPackageName } from '../../registry.js'
import { BaseImporter, BaseMirrorMetadata } from './base.js'

export type ImageMirrorMetadataV1 = BaseMirrorMetadata & {
  importKind: MirrorKindKeys<'Image'>
  distributionPackageName: string
  schemaVersion: 1
}

export type ImageMirrorMetadataV2 = BaseMirrorMetadata & {
  importKind: MirrorKindKeys<'Image'>
  // TODO FIX - temporary to resolve build issues
  distributionPackageName: string
  schemaVersion: 2
}

export type ImageMirrorInformation = {
  metadata: ImageMirrorMetadataV1 | ImageMirrorMetadataV2
  // image: { modelId: string; imageName: string; imageTag: string }
  images: Array<{ modelId: string; imageName: string; imageTag: string }>
}

export class ImageImporter extends BaseImporter {
  declare protected readonly metadata: ImageMirrorMetadataV1 | ImageMirrorMetadataV2

  protected readonly user: UserInterface
  protected readonly imageName?: string
  protected readonly imageTag?: string
  protected manifestBody?: ImageManifestV2 | null = null
  // New, for V2
  protected manifests = new Map<string, { imageName: string; imageTag: string; manifest: ImageManifestV2 }>()

  // V1 -> { type: 'text', filename: 'manifest.json', content: tagManifestJson },
  static readonly manifestRegexV1 = new RegExp(
    String.raw`^${escapeRegExp(config.modelMirror.contentDirectory)}/manifest\.json$`,
  )
  // V2 -> { type: 'text', filename: `images/manifests/${imageName}/${imageTag}.json`, content: tagManifestJson },
  // regex is more generic to capture the multiple, differently named manifests
  static readonly manifestRegexV2 = new RegExp(
    String.raw`^${escapeRegExp(config.modelMirror.contentDirectory)}/images/manifests.+json$`,
  )

  // V1 'entryname' -> const entryName = `blobs/sha256/${layerDigest.replace(/^(sha256:)/, '')}`
  static readonly blobRegexV1 = new RegExp(
    String.raw`^${escapeRegExp(config.modelMirror.contentDirectory)}/blobs\/sha256\/[0-9a-f]{64}$`,
  )
  //V2 'entryname' -> const digest = layerDigest.replace(/^sha256:/, '') -> entryName = `images/blobs/sha256/${digest}`
  static readonly blobRegexV2 = new RegExp(
    String.raw`^${escapeRegExp(config.modelMirror.contentDirectory)}/images\/blobs\/sha256\/[0-9a-f]{64}$`,
  )

  constructor(
    user: UserInterface,
    metadata: ImageMirrorMetadataV1 | ImageMirrorMetadataV2,
    logData: MirrorImportLogData,
  ) {
    super(metadata, logData)
    if (this.metadata.importKind !== MirrorKind.Image) {
      throw InternalError('Cannot parse compressed Image: incorrect metadata specified.', {
        metadata: this.metadata,
        ...this.logData,
      })
    }

    this.user = user
    if (metadata.schemaVersion === 1 && metadata.distributionPackageName) {
      const distributionPackageNameObject = splitDistributionPackageName(metadata.distributionPackageName)
      if (!('tag' in distributionPackageNameObject)) {
        throw InternalError('Distribution Package Name must include a tag.', {
          distributionPackageNameObject,
          distributionPackageName: metadata.distributionPackageName,
          metadata: this.metadata,
          ...this.logData,
        })
      }
      ;({ path: this.imageName, tag: this.imageTag } = distributionPackageNameObject)
    }
    if (metadata.schemaVersion === 2) {
      this.manifests = new Map()
    }
  }

  async processEntry(entry: Headers, stream: PassThrough) {
    switch (this.metadata.schemaVersion) {
      case 2:
        if (entry.type === 'file') {
          // Process file
          if (ImageImporter.manifestRegexV2.test(entry.name)) {
            // manifest.json must be uploaded after the other layers otherwise the registry will error as the referenced layers won't yet exist
            log.debug({ ...this.logData }, 'Extracting un-tarred manifest.')
            const extractedManifestBody = ImageManifestV2Schema.parse(await json(stream))
            const { imageName, imageTag } = parseManifestFilePath(entry.name)
            this.manifests.set(`${imageName}:${imageTag}`, {
              imageName,
              imageTag,
              manifest: extractedManifestBody,
            })
          } else if (ImageImporter.blobRegexV2.test(entry.name)) {
            // convert filename to digest format
            const layerDigest = `${entry.name.replace(new RegExp(String.raw`^(${config.modelMirror.contentDirectory}/images\/blobs\/sha256\/)`), 'sha256:')}`

            const repositoryPullToken = await issueAccessToken({ dn: this.user.dn }, [
              {
                type: 'repository',
                name: `${this.metadata.mirroredModelId}/${this.imageName}`,
                actions: ['pull'],
              },
            ])
            const repositoryPushPullToken = await issueAccessToken({ dn: this.user.dn }, [
              {
                type: 'repository',
                name: `${this.metadata.mirroredModelId}/${this.imageName}`,
                actions: ['push', 'pull'],
              },
            ])

            try {
              if (
                await doesLayerExist(
                  repositoryPullToken,
                  { repository: this.metadata.mirroredModelId, name: this.metadata.mirroredModelId },
                  layerDigest,
                )
              ) {
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
                const res = await initialiseUpload(repositoryPushPullToken, {
                  repository: this.metadata.mirroredModelId,
                  name: this.metadata.mirroredModelId,
                })

                log.debug(
                  {
                    name: entry.name,
                    size: entry.size,
                    ...this.logData,
                  },
                  'Putting image blob.',
                )
                await uploadLayerMonolithic(
                  repositoryPushPullToken,
                  res.location!,
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
          }
        } else {
          // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
          log.warn({ name: entry.name, type: entry.type, ...this.logData }, 'Skipping non-file entry.')
        }
        break
      case 1:
        if (entry.type === 'file') {
          // Process file
          if (ImageImporter.manifestRegexV1.test(entry.name)) {
            // manifest.json must be uploaded after the other layers otherwise the registry will error as the referenced layers won't yet exist
            log.debug({ ...this.logData }, 'Extracting un-tarred manifest.')
            this.manifestBody = ImageManifestV2Schema.parse(await json(stream))
          } else if (ImageImporter.blobRegexV1.test(entry.name)) {
            // convert filename to digest format
            const layerDigest = `${entry.name.replace(new RegExp(String.raw`^(${config.modelMirror.contentDirectory}/blobs\/sha256\/)`), 'sha256:')}`

            const repositoryPullToken = await issueAccessToken({ dn: this.user.dn }, [
              {
                type: 'repository',
                name: `${this.metadata.mirroredModelId}/${this.imageName}`,
                actions: ['pull'],
              },
            ])
            const repositoryPushPullToken = await issueAccessToken({ dn: this.user.dn }, [
              {
                type: 'repository',
                name: `${this.metadata.mirroredModelId}/${this.imageName}`,
                actions: ['push', 'pull'],
              },
            ])

            // TODO - to make this nicer with errors
            if (!this.imageName) {
              throw InternalError('Image name missing')
            }

            if (!this.imageTag) {
              throw InternalError('Image tag missing')
            }

            try {
              if (
                await doesLayerExist(
                  repositoryPullToken,
                  { repository: this.metadata.mirroredModelId, name: this.imageName },
                  layerDigest,
                )
              ) {
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
                const res = await initialiseUpload(repositoryPushPullToken, {
                  repository: this.metadata.mirroredModelId,
                  name: this.imageName,
                })

                log.debug(
                  {
                    name: entry.name,
                    size: entry.size,
                    ...this.logData,
                  },
                  'Putting image blob.',
                )
                await uploadLayerMonolithic(
                  repositoryPushPullToken,
                  res.location!,
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
        break
      default:
        log.warn('PLACEHOLDER MESSAGE')
    }
  }

  async handleStreamCompletion(resolve: (reason?: ImageMirrorInformation) => void, reject: (reason?: unknown) => void) {
    log.debug({ ...this.logData }, 'Uploading manifest.')
    const uploadedImages: Array<{ modelId: string; imageName: string; imageTag: string }> = []

    switch (this.metadata.schemaVersion) {
      case 2:
        for (const manifest of this.manifests.values()) {
          const repositoryPushPullToken = await issueAccessToken({ dn: this.user.dn }, [
            {
              type: 'repository',
              name: `${this.metadata.mirroredModelId}/${manifest.imageName}`,
              actions: ['push', 'pull'],
            },
          ])

          const mediaType =
            manifest.manifest.mediaType == OCIEmptyMediaType
              ? manifest.manifest.artifactType
              : manifest.manifest.mediaType

          await putManifest(
            repositoryPushPullToken,
            {
              repository: this.metadata.mirroredModelId,
              name: manifest.imageName,
              tag: manifest.imageTag,
            },
            JSON.stringify(manifest),
            mediaType,
          )

          log.debug(
            {
              image: {
                modelId: this.metadata.mirroredModelId,
                name: manifest.imageName,
                tag: manifest.imageTag,
              },
              ...this.logData,
            },
            'Completed registry upload',
          )

          uploadedImages.push({
            modelId: this.metadata.mirroredModelId,
            imageName: manifest.imageName,
            imageTag: manifest.imageTag,
          })
        }

        resolve({
          metadata: this.metadata,
          images: uploadedImages,
        })

        break
      case 1:
        if (this.manifestBody) {
          const repositoryPushPullToken = await issueAccessToken({ dn: this.user.dn }, [
            {
              type: 'repository',
              name: `${this.metadata.mirroredModelId}/${this.imageName}`,
              actions: ['push', 'pull'],
            },
          ])

          // TODO - to make this nicer with errors
          if (!this.imageName) {
            throw InternalError('Image name missing')
          }

          if (!this.imageTag) {
            throw InternalError('Image tag missing')
          }

          const mediaType =
            this.manifestBody.mediaType == OCIEmptyMediaType
              ? this.manifestBody.artifactType
              : this.manifestBody.mediaType
          await putManifest(
            repositoryPushPullToken,
            { repository: this.metadata.mirroredModelId, name: this.imageName, tag: this.imageTag },
            JSON.stringify(this.manifestBody),
            mediaType,
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
            images: [{ modelId: this.metadata.mirroredModelId, imageName: this.imageName, imageTag: this.imageTag }],
          })
        } else {
          reject(
            InternalError('Manifest file (manifest.json) missing or invalid in Tarball file.', {
              metadata: this.metadata,
              ...this.logData,
            }),
          )
        }
        break
      default:
        log.info('PLACEHOLDER')
    }
  }
}
