import { PassThrough } from 'node:stream'

import { registryRequest, registryRequestStream } from '../clients/registry.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import { InternalError } from '../utils/error.js'
import { ExportMetadata, uploadToExportS3Location } from './mirroredModel.js'

async function exportRegistryLayer(
  modelId: string,
  imageName: string,
  layerDigest: string,
  token: string,
  logData: Record<string, unknown>,
  metadata?: ExportMetadata,
) {
  const path = `beta/registry/${modelId}/${imageName}/blobs/${layerDigest}`

  const responseBody = await registryRequestStream(token, `${modelId}/${imageName}/blobs/${layerDigest}`)

  if (responseBody === null || !responseBody.ok || responseBody.body === null) {
    throw InternalError('Unrecognised response body when getting image layer blob.', {
      responseBody,
      modelId,
      imageName,
      layerDigest,
    })
  }

  const passThroughStream = new PassThrough()
  responseBody.body.pipe(passThroughStream)

  uploadToExportS3Location(path, passThroughStream, logData, metadata)
}

export async function exportRegistryImage(
  modelId: string,
  imageName: string,
  imageTag: string,
  logData: Record<string, unknown>,
  metadata?: ExportMetadata,
) {
  const token = await getAccessToken({ dn: 'user' }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['*'] },
  ])

  const responseBody = await registryRequest(token, `${modelId}/${imageName}/manifests/${imageTag}`)
  if (responseBody === null || !responseBody.ok) {
    throw InternalError('Unrecognised response body when getting image tag manifest.', {
      responseBody,
      modelId,
      imageName,
      imageTag,
    })
  }

  await Promise.all(
    responseBody['layers'].map(async (layer: object) => {
      const layerDigest = layer['digest']
      if (!layerDigest || layerDigest.length === 0) {
        throw InternalError('Could not extract layer digest.', { layer, modelId, imageName, imageTag })
      }

      await exportRegistryLayer(modelId, imageName, layerDigest, token, logData, metadata)
    }),
  )
}
