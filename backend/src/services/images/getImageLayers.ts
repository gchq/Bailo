import { getImageTagManifest, isImageTagManifestList } from '../../clients/registry.js'
import { ImageRefInterface } from '../../models/Release.js'
import { isRegistryError } from '../../types/RegistryError.js'
import { InternalError, NotFound } from '../../utils/error.js'
import { Descriptors } from '../../utils/registryResponses.js'

/**
 * @throws InternalError if the requested image has a manifest list
 * @remarks
 * This does _not_ do an auth check on the user
 */
export async function getImageLayers(repositoryToken: string, image: ImageRefInterface): Promise<Descriptors[]> {
  try {
    if (await isImageTagManifestList(repositoryToken, image)) {
      // TODO: add support for manifest lists/fat manifests
      throw InternalError('Bailo backend does not currently support manifest lists.', { image })
    }

    const res = await getImageTagManifest(repositoryToken, image)

    if (!res.body) {
      throw InternalError('Registry manifest body missing.', { image })
    }

    return [res.body.config, ...res.body.layers]
  } catch (error) {
    if (isRegistryError(error) && error.context?.status === 404) {
      throw NotFound('Image does not exist', { image })
    }
    throw error
  }
}
