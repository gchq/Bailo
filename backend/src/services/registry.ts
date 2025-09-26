import { Readable } from 'node:stream'

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
import { Forbidden, InternalError } from '../utils/error.js'
import { getModelById } from './model.js'

// derived from https://pkg.go.dev/github.com/distribution/reference#pkg-overview
const imageRegex =
  /^(?:(?<domain>(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?::\d{1,5})|(?:\d{1,3}\.){3}\d{1,3}|\[(?:[0-9A-Fa-f:.]+)\])(?::\d{1,5})?)\/)?(?<path>[a-z0-9]+(?:(?:[_.]|__|[-]*)[a-z0-9]+)*(?:\/[a-z0-9]+(?:(?:[_.]|__|[-]*)[a-z0-9]+)*)*)(?::(?<tag>[\w][\w.-]{0,127}))?(?:@(?<digest>[A-Za-z][A-Za-z0-9]*(?:[+.\-_][A-Za-z][A-Za-z0-9]*)*:[0-9a-fA-F]{32,}))?$/

export type DistributionPackageName =
  | { domain?: string; path: string; tag: string }
  | { domain?: string; path: string; digest: string }

export function splitDistributionPackageName(distributionPackageName: string): DistributionPackageName {
  const split = imageRegex.exec(distributionPackageName)
  if (!split?.groups || !(split.groups.tag ? !split.groups.digest : split.groups.digest)) {
    throw InternalError('Could not parse Distribution Package Name.', {
      distributionPackageName,
      split,
    })
  }

  const domain = split.groups.domain ?? undefined
  const path = split.groups.path
  if (split.groups.tag) {
    return { ...(domain && { domain }), path, tag: split.groups.tag }
  } else {
    return { ...(domain && { domain }), path, digest: split.groups.digest }
  }
}

export function joinDistributionPackageName(distributionPackageName: DistributionPackageName) {
  if (
    !distributionPackageName ||
    !distributionPackageName.path ||
    (!distributionPackageName['tag'] && !distributionPackageName['digest'])
  ) {
    throw InternalError('Could not join Distribution Package Name.', { distributionPackageName })
  }
  if (distributionPackageName.domain) {
    if (distributionPackageName['tag']) {
      return `${distributionPackageName.domain}/${distributionPackageName.path}:${distributionPackageName['tag']}`
    }
    return `${distributionPackageName.domain}/${distributionPackageName.path}@${distributionPackageName['digest']}`
  }
  if (distributionPackageName['tag']) {
    return `${distributionPackageName.path}:${distributionPackageName['tag']}`
  }
  return `${distributionPackageName.path}@${distributionPackageName['digest']}`
}

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
  return await Promise.all(
    repos.map(async (repo) => {
      const [namespace, image] = repo.split(/\/(.*)/s)
      const repositoryToken = await getAccessToken({ dn: user.dn }, [
        { type: 'repository', class: '', name: repo, actions: ['pull'] },
      ])
      return { repository: namespace, name: image, tags: await listImageTags(repositoryToken, { namespace, image }) }
    }),
  )
}

export async function getImageManifest(user: UserInterface, modelId: string, imageName: string, imageTag: string) {
  await checkUserAuth(user, modelId, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['pull'] },
  ])

  // get which layers exist for the model
  return await getImageTagManifest(repositoryToken, { namespace: modelId, image: imageName }, imageTag)
}

export async function getImageBlob(user: UserInterface, modelId: string, imageName: string, digest: string) {
  await checkUserAuth(user, modelId, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['pull'] },
  ])

  return await getRegistryLayerStream(repositoryToken, { namespace: modelId, image: imageName }, digest)
}

export async function doesImageLayerExist(user: UserInterface, modelId: string, imageName: string, digest: string) {
  await checkUserAuth(user, modelId, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['pull'] },
  ])
  return await doesLayerExist(repositoryToken, { namespace: modelId, image: imageName }, digest)
}

export async function initialiseImageUpload(user: UserInterface, modelId: string, imageName: string) {
  await checkUserAuth(user, modelId, ['push'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['push', 'pull'] },
  ])
  return await initialiseUpload(repositoryToken, { namespace: modelId, image: imageName })
}

export async function putImageBlob(
  user: UserInterface,
  modelId: string,
  imageName: string,
  uploadURL: string,
  digest: string,
  blob: Readable | ReadableStream,
  size: string,
) {
  await checkUserAuth(user, modelId, ['push'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', class: '', name: `${modelId}/${imageName}`, actions: ['push', 'pull'] },
  ])
  return await uploadLayerMonolithic(repositoryToken, uploadURL, digest, blob, size)
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
  return await putManifest(
    repositoryToken,
    { namespace: modelId, image: imageName },
    imageTag,
    manifestText,
    contentType,
  )
}
