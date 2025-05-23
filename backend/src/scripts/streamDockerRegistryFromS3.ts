import zlib from 'node:zlib'

import { finished } from 'stream/promises'
import { extract } from 'tar-stream'

import { doesLayerExist, initialiseUpload, putImageManifest, uploadLayerMonolithic } from '../clients/registry.js'
import { ensureBucketExists } from '../clients/s3.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import log from '../services/log.js'
import { getObjectFromExportS3Location } from '../services/mirroredModel.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import { InternalError } from '../utils/error.js'

async function script() {
  // process args
  const args = process.argv.slice(2)[0].split(',')
  if (args.length != 4) {
    log.error(
      'Please use format "npm run script -- streamDockerRegistryFromS3 <input-s3-path> <output-model-id> <output-image-name> <output-image-tag"',
    )
    return
  }
  const inputS3Path = args[0]
  const outputImageModel = args[1]
  const outputImageName = args[2]
  const outputImageTag = args[3]
  log.info({ inputS3Path }, { outputImageModel, outputImageName, outputImageTag })

  // setup
  await connectToMongoose()
  ensureBucketExists(config.modelMirror.export.bucket)

  // main functionality
  const repositoryToken = await getAccessToken({ dn: 'user' }, [
    { type: 'repository', class: '', name: `${outputImageModel}/${outputImageName}`, actions: ['*'] },
  ])

  const gzipStream = zlib.createGunzip({ chunkSize: 16 * 1024 * 1024 })
  const tarStream = extract()
  const tarGzBlob = await getObjectFromExportS3Location(inputS3Path, {})
  tarGzBlob.pipe(gzipStream).pipe(tarStream)

  let manifestBody
  await new Promise((resolve, reject) => {
    tarStream.on('entry', async function (entry, stream, next) {
      log.debug('Processing un-tarred entry', {
        tarball: inputS3Path,
        name: entry.name,
        type: entry.type,
        size: entry.size,
      })

      if (entry.type === 'file') {
        // Process file
        if (entry.name === 'manifest.json') {
          // manifest.json must be uploaded after the other layers otherwise the registry will error as the referenced layers won't yet exist
          log.debug('Extracting un-tarred manifest', { tarball: inputS3Path })
          manifestBody = await new Response(stream).json()

          next()
        } else {
          // convert filename to digest format
          const layerDigest = `${entry.name.replace(/^(blobs\/sha256\/)/, 'sha256:')}`
          if (
            await doesLayerExist(repositoryToken, { namespace: outputImageModel, image: outputImageName }, layerDigest)
          ) {
            log.debug('Skipping blob as it already exists in the registry', {
              tarball: inputS3Path,
              name: entry.name,
              size: entry.size,
            })

            // auto-drain the stream
            stream.resume()
            next()
          } else {
            log.debug('Initiating un-tarred blob upload', { tarball: inputS3Path, name: entry.name, size: entry.size })
            const res = await initialiseUpload(repositoryToken, { namespace: outputImageModel, image: outputImageName })

            await uploadLayerMonolithic(repositoryToken, res.location, layerDigest, stream, String(entry.size))
            await finished(stream)
            next()
          }
        }
      } else {
        // skip entry of type: link | symlink | directory | block-device | character-device | fifo | contiguous-file
        log.warn('Skipping non-file entry', { tarball: inputS3Path, name: entry.name, type: entry.type })
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
      log.debug('Uploading manifest', { tarball: inputS3Path })
      await putImageManifest(
        repositoryToken,
        { namespace: outputImageModel, image: outputImageName },
        outputImageTag,
        JSON.stringify(manifestBody),
        manifestBody['mediaType'],
      )
      resolve('ok')
    })
  })
  log.debug('Completed registry upload', {
    tarball: inputS3Path,
    image: { outputImageModel, outputImageName, outputImageTag },
  })

  // cleanup
  setTimeout(disconnectFromMongoose, 50)
}

script()
