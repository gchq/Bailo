import { PassThrough } from 'node:stream'
import zlib from 'node:zlib'

import { getImageTagManifest, getRegistryLayerStream } from '../clients/registry.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import { InternalError } from '../utils/error.js'
import { ExportMetadata, uploadToExportS3Location } from './mirroredModel.js'

// Functionally similar to `buffer.write(stream)` but forces a wait until the buffer has finished draining.
// This is useful when handling large buffers e.g. multi-gigabyte docker layers
function writeAndWait(stream: PassThrough, buffer: Buffer) {
  return new Promise<void>((resolve, _reject) => {
    if (!stream.write(buffer)) {
      // wait for drain event before continuing
      stream.once('drain', resolve)
    } else {
      // if the write was successfully then immediately resolve
      resolve()
    }
  })
}

async function compressBuffers(streamBuffers: Buffer<ArrayBufferLike>[]) {
  // setup gzip
  const passThroughStream = new PassThrough()
  const gzipStream = zlib.createGzip()
  passThroughStream.pipe(gzipStream)

  // add each buffer to the gzip stream one at a time (this must be synchronous)
  for (const streamBuffer of streamBuffers) {
    await writeAndWait(passThroughStream, streamBuffer)
  }
  passThroughStream.end()

  return gzipStream
}

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

  const responseBody = await getImageTagManifest(token, { namespace: modelId, image: imageName }, imageTag)

  // download all layers and extract buffers from their streamed response
  const layerStreamBuffers = await Promise.all(
    responseBody['layers'].map(async (layer: object) => {
      const layerDigest = layer['digest']
      if (!layerDigest || layerDigest.length === 0) {
        throw InternalError('Could not extract layer digest.', { layer, modelId, imageName, imageTag, ...logData })
      }

      const responseBody = await getRegistryLayerStream(token, { namespace: modelId, image: imageName }, layerDigest)

      // use deprecated buffer as per https://github.com/nodejs/node/issues/43433
      return await responseBody.buffer()
    }),
  )

  const gzipStream = await compressBuffers(layerStreamBuffers)

  // upload the gzip stream to S3
  const path = `beta/registry/${modelId}/${imageName}/blobs/compressed/${imageTag}.tar.gz`
  await uploadToExportS3Location(path, gzipStream, logData, metadata)
}
