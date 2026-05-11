import { getImageTagManifest, getImageTagManifests } from '../../clients/registry.js'
import { ImageRef } from '../../models/Release.js'
import { isRegistryError } from '../../types/RegistryError.js'
import { InternalError, NotFound } from '../../utils/error.js'
import { Descriptors } from '../../utils/registryResponses.js'

/**
 * @remarks
 * This does _not_ do an auth check on the user
 */
export async function getImageLayers(repositoryToken: string, image: ImageRef): Promise<Descriptors[]> {
  try {
    const manifestResponse = await getImageTagManifests(repositoryToken, image)

    if (!manifestResponse.body) {
      throw InternalError('Registry manifest body missing.', { image })
    }

    if ('manifests' in manifestResponse.body) {
      return (
        await Promise.all(
          manifestResponse.body.manifests.map(async (manifest) =>
            getLayersForImage(repositoryToken, {
              repository: image.repository,
              name: image.name,
              digest: manifest.digest,
            }),
          ),
        )
      ).flat()
    }

    return [manifestResponse.body.config, ...manifestResponse.body.layers]
  } catch (error) {
    if (isRegistryError(error) && error.context?.status === 404) {
      throw NotFound('Image does not exist', { image })
    }
    throw error
  }
}

export async function getLayersForImage(repositoryToken: string, imageRef: ImageRef): Promise<Descriptors[]> {
  const manifest = await getImageTagManifest(repositoryToken, imageRef)

  if (!manifest.body || 'manifests' in manifest.body) {
    throw InternalError('The registry returned a response but the body was missing.', { manifest })
  }

  return [manifest.body.config, ...manifest.body.layers]
}
