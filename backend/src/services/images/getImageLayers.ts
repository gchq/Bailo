import { resolveToImageManifests } from '../../clients/registry.js'
import { ImageRefInterface } from '../../models/Release.js'
import { isRegistryError } from '../../types/RegistryError.js'
import { dedupe } from '../../utils/array.js'
import { NotFound } from '../../utils/error.js'
import { Descriptors } from '../../utils/registryResponses.js'

/**
 * @throws InternalError if the requested image has a manifest list
 * @remarks
 * This does _not_ do an auth check on the user
 */
export async function getImageLayers(
  repositoryToken: string,
  image: ImageRefInterface,
  platform?: string,
): Promise<Descriptors[]> {
  try {
    const manifests = await resolveToImageManifests(repositoryToken, image, platform)

    return dedupe(manifests.flatMap((manifest) => [manifest.config, ...manifest.layers]))
  } catch (error) {
    if (isRegistryError(error) && error.context?.status === 404) {
      throw NotFound('Image does not exist', { image })
    }
    throw error
  }
}
