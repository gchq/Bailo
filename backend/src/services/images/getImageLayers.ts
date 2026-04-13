import { getImageTagManifest, getImageTagManifests } from '../../clients/registry.js'
import { ImageRefInterface } from '../../models/Release.js'
import { isRegistryError } from '../../types/RegistryError.js'
import { InternalError, NotFound } from '../../utils/error.js'
import { Descriptors } from '../../utils/registryResponses.js'
import { platformToString } from '../../utils/registryUtils.js'

/**
 * @remarks
 * This does _not_ do an auth check on the user
 */
export async function getImageLayers(repositoryToken: string, image: ImageRefInterface): Promise<Descriptors[]> {
  try {
    const manifestResponse = await getImageTagManifests(repositoryToken, image)

    if (!manifestResponse.body) {
      throw InternalError('Registry manifest body missing.', { image })
    }

    if ('manifests' in manifestResponse.body) {
      const layersByPlatform = await getLayersByPlatform(repositoryToken, image)

      return (await Promise.all(Object.values(layersByPlatform))).flat()
    }

    return [manifestResponse.body.config, ...manifestResponse.body.layers]
  } catch (error) {
    if (isRegistryError(error) && error.context?.status === 404) {
      throw NotFound('Image does not exist', { image })
    }
    throw error
  }
}

export async function getLayersForImageTag(
  repositoryToken: string,
  imageRef: ImageRefInterface,
): Promise<Descriptors[]> {
  const manifest = await getImageTagManifest(repositoryToken, imageRef)

  if (!manifest.body || 'manifests' in manifest.body) {
    throw InternalError('The registry returned a response but the body was missing.', { manifest })
  }

  return [manifest.body.config, ...manifest.body.layers]
}

export async function getLayersByPlatform(
  token: string,
  imageRef: ImageRefInterface,
): Promise<Record<string, Promise<Descriptors[]>>> {
  const { body } = await getImageTagManifests(token, imageRef)

  if (!body || !('manifests' in body)) {
    throw InternalError('Missing manifest list body.', { imageRef })
  }

  const target = {}

  for (const manifest of body.manifests) {
    const platform = platformToString(manifest.platform)
    if (platform !== 'unknown/unknown') {
      target[platform] = manifest
    }
  }

  return new Proxy(target, {
    async get(obj, prop: string) {
      const manifest = obj[prop]
      if (!manifest) {
        return undefined
      }

      const ref = { ...imageRef, tag: manifest.digest }
      const child = await getImageTagManifests(token, ref)

      if (!child.body || 'manifests' in child.body) {
        throw InternalError('Nested manifest list not supported.', { ref })
      }

      return [child.body.config, ...child.body.layers]
    },
  })
}
