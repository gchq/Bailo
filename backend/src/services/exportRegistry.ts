import zlib from 'node:zlib'

import { getImageTagManifest, getRegistryLayerStream } from '../clients/registry.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import { InternalError } from '../utils/error.js'
import log from './log.js'
import { ExportMetadata, uploadToExportS3Location } from './mirroredModel.js'

export async function exportCompressedRegistryImage(
  modelId: string,
  imageName: string,
  imageTag: string,
  logData: Record<string, unknown>,
  metadata?: ExportMetadata,
) {
  const token = await getAccessToken({ dn: 'user' }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['*'] },
  ])

  // get the required layers
  const responseBody = await getImageTagManifest(token, { namespace: modelId, image: imageName }, imageTag)
  const layers = responseBody['layers']
  log.debug('Got image manifest', {
    modelId,
    imageName,
    imageTag,
    layersLength: layers.length,
    layers: layers.map((layer: { [x: string]: any }) => {
      return { size: layer['size'], digest: layer['digest'] }
    }),
    ...logData,
  })

  // setup gzip
  const gzipStream = zlib.createGzip({ chunkSize: 16 * 1024 * 1024, level: zlib.constants.Z_BEST_SPEED })
  // one error emitter per layer
  gzipStream.setMaxListeners(layers.length)

  // start uploading the gzip stream to S3
  const path = `beta/registry/${modelId}/${imageName}/blobs/compressed/${imageTag}.tar.gz`
  const s3Upload = uploadToExportS3Location(path, gzipStream, logData, metadata)

  // fetch and compress one layer at a time to manage RAM usage
  // also, gzip can only handle one pipe at a time
  for (const layer of layers) {
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
    const responseBody = await getRegistryLayerStream(token, { namespace: modelId, image: imageName }, layerDigest)

    if (responseBody === null || !responseBody.ok || responseBody.body === null) {
      throw InternalError('Unrecognised response body when getting image layer blob.', {
        responseBody,
        modelId,
        imageName,
        imageTag,
        layerDigest,
        ...logData,
      })
    }

    // pipe the body to gzip using streams
    await new Promise<void>((resolve, reject) => {
      responseBody.body
        ?.on('error', (err) => {
          reject(InternalError('Error while fetching layer stream', { layerDigest, error: err }))
        })
        .on('end', () => {
          log.debug('Finished fetching layer stream', { layerDigest })
          // call `resolve()` otherwise the pipe will get stuck
          resolve()
        })
        // pipe to gzip but indicate more data is coming
        .pipe(gzipStream, { end: false })
        .on('error', (err) => {
          reject(InternalError('Error while compressing layer stream', { layerDigest, error: err }))
        })
    })
  }
  // no more data to write
  gzipStream.end()

  // wait for the upload to complete
  await s3Upload
}
