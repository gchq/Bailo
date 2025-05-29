import { Stream } from 'node:stream'

import {
  doesLayerExist,
  getImageTagManifest,
  getRegistryLayerStream,
  initialiseUpload,
  listImageTags,
  listModelRepos,
  putManifest,
  uploadLayerMonolithic,
} from '../clients/registry.js'
import authorisation from '../connectors/authorisation/index.js'
import { UserInterface } from '../models/User.js'
import { Action, getAccessToken } from '../routes/v1/registryAuth.js'
import { Forbidden } from '../utils/error.js'
import { getModelById } from './model.js'

async function checkUserAuth(user: UserInterface, modelId: string, actions: Action[] = []) {
  const model = await getModelById(user, modelId)

  const auth = await authorisation.image(user, model, {
    type: 'repository',
    name: modelId,
    actions: actions,
  })
  if (!auth.success) {
    throw Forbidden(auth.info, { userDn: user.dn, modelId })
  }
}

export async function listModelImages(user: UserInterface, modelId: string) {
  await checkUserAuth(user, modelId, ['list'])

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

export async function getImageManifest(user: UserInterface, modelId: string, imageName: string, imageTag: string) {
  await checkUserAuth(user, modelId, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['pull'] },
  ])

  // get which layers exist for the model
  const manifest = (await getImageTagManifest(repositoryToken, { namespace: modelId, image: imageName }, imageTag))
    .responseBody

  return manifest
}

export async function getImageBlob(user: UserInterface, modelId: string, imageName: string, digest: string) {
  await checkUserAuth(user, modelId, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['pull'] },
  ])
  const responseBody = await getRegistryLayerStream(repositoryToken, { namespace: modelId, image: imageName }, digest)

  return responseBody
}

export async function doesImageLayerExist(user: UserInterface, modelId: string, imageName: string, digest: string) {
  await checkUserAuth(user, modelId, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['pull'] },
  ])
  const responseBody = await doesLayerExist(repositoryToken, { namespace: modelId, image: imageName }, digest)

  return responseBody
}

export async function initialiseImageUpload(user: UserInterface, modelId: string, imageName: string) {
  await checkUserAuth(user, modelId, ['push'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['push', 'pull'] },
  ])
  const responseBody = await initialiseUpload(repositoryToken, { namespace: modelId, image: imageName })

  return responseBody
}

export async function putImageBlob(
  user: UserInterface,
  modelId: string,
  imageName: string,
  uploadURL: string,
  digest: string,
  blob: Stream,
  size: string,
) {
  await checkUserAuth(user, modelId, ['push'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['push', 'pull'] },
  ])
  const responseBody = await uploadLayerMonolithic(repositoryToken, uploadURL, digest, blob, size)

  return responseBody
}

export async function putImageManifest(
  user: UserInterface,
  modelId: string,
  imageName: string,
  imageTag: string,
  manifestText: string,
  contentType: string,
) {
  await checkUserAuth(user, modelId, ['push'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['push', 'pull'] },
  ])
  const responseBody = await putManifest(
    repositoryToken,
    { namespace: modelId, image: imageName },
    imageTag,
    manifestText,
    contentType,
  )

  return responseBody
}
