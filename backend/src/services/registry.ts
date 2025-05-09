import { getImageTagManifest, getRegistryLayerStream, listImageTags, listModelRepos } from '../clients/registry.js'
import authorisation from '../connectors/authorisation/index.js'
import { UserInterface } from '../models/User.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import { Forbidden } from '../utils/error.js'
import { getModelById } from './model.js'

export async function listModelImages(user: UserInterface, modelId: string) {
  const model = await getModelById(user, modelId)

  const auth = await authorisation.image(user, model, {
    type: 'repository',
    name: modelId,
    actions: ['list'],
  })
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  const registryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'registry', class: '', name: 'catalog', actions: ['*'] },
  ])
  const repos = await listModelRepos(registryToken, modelId)
  const versions = await Promise.all(
    repos.map(async (repo) => {
      const [namespace, image] = repo.split(/\/(.*)/s)
      const repositoryToken = await getAccessToken({ dn: user.dn }, [
        { type: 'repository', class: '', name: repo, actions: ['pull'] },
      ])
      return { repository: namespace, name: image, tags: await listImageTags(repositoryToken, { namespace, image }) }
    }),
  )

  return versions
}

export async function listImageTagLayers(user: UserInterface, modelId: string, imageName: string, imageTag: string) {
  const model = await getModelById(user, modelId)

  const auth = await authorisation.image(user, model, {
    type: 'repository',
    name: modelId,
    actions: ['pull'],
  })
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['*'] },
  ])

  // get which layers exist for the model
  const manifest = await getImageTagManifest(repositoryToken, { namespace: modelId, image: imageName }, imageTag)

  return manifest.layers
}

export async function getImageBlob(user: UserInterface, modelId: string, imageName: string, digest: string) {
  const model = await getModelById(user, modelId)

  const auth = await authorisation.image(user, model, {
    type: 'repository',
    name: modelId,
    actions: ['pull'],
  })
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['*'] },
  ])
  const responseBody = await getRegistryLayerStream(repositoryToken, { namespace: modelId, image: imageName }, digest)

  return responseBody
}
