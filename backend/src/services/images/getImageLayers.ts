import { getImageTagManifest } from '../../clients/registry.js'
import { ImageRefInterface } from '../../models/Release.js'
import { InternalError } from '../../utils/error.js'

export interface ImageLayer {
  digest: string
  size?: number
}

export async function getImageLayers(registryToken: string, image: ImageRefInterface): Promise<ImageLayer[]> {
  const res = await getImageTagManifest(registryToken, image)
  if (!res.body) {
    throw InternalError('Registry manifest body missing.', { image })
  }

  return [res.body.config, ...res.body.layers].map((layer) => ({
    digest: layer.digest,
    size: layer.size,
  }))
}
