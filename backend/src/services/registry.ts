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
  /^((?=[^:/]{1,253})(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*(?::[0-9]{1,5})?)(?:\/)?((?![._-])(?:[a-z0-9._-]*)(?<![._-])(?:\/(?![._-])[a-z0-9._-]*(?<![._-]))*)(?:(?:@((?![+.\-_])[A-Za-z][a-zA-Z0-9+.\-_]*(?<![+.\-_]):[0-9a-fA-F]{32,}))|)(?:(?::((?![.-])[a-zA-Z0-9_.-]{1,128}))|)$/
export type DistributionPackageName = { domain: string; path: string } & ({ tag: string } | { digest: string })
export function splitDistributionPackageName(containerNameFull: string): DistributionPackageName {
  const split = imageRegex.exec(containerNameFull)
  // Group 3 is tag and 4 is digest. These can be empty strings to preserve indexing, but at least one must be present.
  if (!split || split.length != 5 || !(split[3]?.length ^ split[4]?.length)) {
    throw InternalError('Could not parse Distribution Package Name.', { containerNameFull, split })
  }
  // tag
  if (split[4] && split[4].length) {
    // `path` ends up in group 1 when there's no domain, otherwise is in group 2
    if (split[2].length) {
      return { domain: split[1], path: split[2], tag: split[4] }
    }
    return { domain: '', path: split[1], tag: split[4] }
  }
  // digest
  if (split[2].length) {
    return { domain: split[1], path: split[2], digest: split[3] }
  }
  return { domain: '', path: split[1], digest: split[3] }
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
  const manifest = await getImageTagManifest(repositoryToken, { namespace: modelId, image: imageName }, imageTag)

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
  blob: Readable | ReadableStream,
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
