import { ImageRefInterface } from '../../models/Release.js'
import { UserInterface } from '../../models/User.js'
import { InternalError } from '../../utils/error.js'
import { Descriptors } from '../../utils/registryResponses.js'
import { getImageManifest } from '../registry.js'

export async function getImageLayers(user: UserInterface, image: ImageRefInterface): Promise<Descriptors[]> {
  const res = await getImageManifest(user, image)
  if (!res.body) {
    throw InternalError('Registry manifest body missing.', { image })
  }

  return [res.body.config, ...res.body.layers]
}
