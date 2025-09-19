import { json } from 'node:stream/consumers'

import { Readable } from 'stream'
import { finished } from 'stream/promises'

import { UserInterface } from '../../../models/User.js'
import { InternalError } from '../../../utils/error.js'
import { extractTarGzStream } from '../../../utils/tarball.js'
import { hasKeysOfType } from '../../../utils/typeguards.js'
import log from '../../log.js'
import {
  doesImageLayerExist,
  initialiseImageUpload,
  putImageBlob,
  putImageManifest,
  splitDistributionPackageName,
} from '../../registry.js'

const manifestRegex = /^manifest\.json$/
const blobRegex = /^blobs\/sha256\/[0-9a-f]{64}$/

export async function importCompressedRegistryImage(
  user: UserInterface,
  body: Readable,
  modelId: string,
  distributionPackageName: string,
  importId: string,
) {
  const distributionPackageNameObject = splitDistributionPackageName(distributionPackageName)
  if (!('tag' in distributionPackageNameObject)) {
    throw InternalError('Distribution Package Name must include a tag.', {
      distributionPackageNameObject,
      distributionPackageName,
    })
  }
  const { path: imageName, tag: imageTag } = distributionPackageNameObject

  let manifestBody: unknown

  await extractTarGzStream(
    body,
    async function (entry, stream, next) {
      log.debug(
        {
          name: entry.name,
          type: entry.type,
          size: entry.size,
          importId,
        },
        'Processing un-tarred entry',
      )

      if (entry.type === 'file') {
        // Process file
        if (manifestRegex.test(entry.name)) {
          // manifest.json must be uploaded after the other layers otherwise the registry will error as the referenced layers won't yet exist
          log.debug({ importId }, 'Extracting un-tarred manifest')
          manifestBody = await json(stream)

          next()
        } else if (blobRegex.test(entry.name)) {
          // convert filename to digest format
          const layerDigest = `${entry.name.replace(/^(blobs\/sha256\/)/, 'sha256:')}`
          try {
            if (await doesImageLayerExist(user, modelId, imageName, layerDigest)) {
              log.debug(
                {
                  name: entry.name,
                  size: entry.size,
                  importId,
                },
                'Skipping blob as it already exists in the registry',
              )

              // auto-drain the stream
              stream.resume()
              next()
            } else {
              log.debug(
                {
                  name: entry.name,
                  size: entry.size,
                  importId,
                },
                'Initiating un-tarred blob upload',
              )
              const res = await initialiseImageUpload(user, modelId, imageName)

              await putImageBlob(user, modelId, imageName, res.location, layerDigest, stream, String(entry.size))
              await finished(stream)
              next()
            }
          } catch (err) {
            log.error(
              {
                err,
                name: entry.name,
                size: entry.size,
                importId,
              },
              'Failed to upload blob to registry.',
            )
            next(err)
          }
        } else {
          throw InternalError('Cannot parse compressed image: unrecognised contents.', {
            importId,
          })
        }
      } else {
        // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
        log.warn({ name: entry.name, type: entry.type, importId }, 'Skipping non-file entry')
        next()
      }
    },
    undefined,
    async function (resolve: (reason?: any) => void, reject: (reason?: any) => void) {
      log.debug({ importId }, 'Uploading manifest')
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
        reject(InternalError('Manifest file (manifest.json) missing or invalid in Tarball file.'))
      }
    },
  )
  log.debug(
    {
      image: { modelId, imageName, imageTag },
      importId,
    },
    'Completed registry upload',
  )

  return { image: { modelId, imageName, imageTag } }
}
