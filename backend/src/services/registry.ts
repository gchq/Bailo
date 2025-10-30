import {
  deleteImage,
  getImageTagManifest,
  getRegistryLayerStream,
  listImageTags,
  listModelRepos,
  mountBlob,
  putManifest,
} from '../clients/registry.js'
import authorisation from '../connectors/authorisation/index.js'
import { UserInterface } from '../models/User.js'
import { Action, getAccessToken } from '../routes/v1/registryAuth.js'
import config from '../utils/config.js'
import { Forbidden, InternalError } from '../utils/error.js'
import log from './log.js'
import { getModelById } from './model.js'

// derived from https://pkg.go.dev/github.com/distribution/reference#pkg-overview
const imageRegex =
  /^(?:(?<domain>(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?::\d{1,5})|(?:\d{1,3}\.){3}\d{1,3}|\[(?:[0-9A-Fa-f:.]+)\])(?::\d{1,5})?)\/)?(?<path>[a-z0-9]+(?:(?:[_.]|__|-+)[a-z0-9]+)*(?:\/[a-z0-9]+(?:(?:[_.]|__|-+)[a-z0-9]+)*)*)(?::(?<tag>[\w][\w.-]{0,127}))?(?:@(?<digest>[A-Za-z][A-Za-z0-9]*(?:[+.\-_][A-Za-z][A-Za-z0-9]*)*:[0-9a-fA-F]{32,}))?$/

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

  const registryToken = await getAccessToken({ dn: user.dn }, [{ type: 'registry', name: 'catalog', actions: ['*'] }])
  const repos = await listModelRepos(registryToken, modelId)
  return await Promise.all(
    repos.map(async (repo) => {
      const [namespace, image] = repo.split(/\/(.*)/s)
      const repositoryToken = await getAccessToken({ dn: user.dn }, [
        { type: 'repository', name: repo, actions: ['pull'] },
      ])
      return { repository: namespace, name: image, tags: await listImageTags(repositoryToken, { namespace, image }) }
    }),
  )
}

export async function getImageManifest(user: UserInterface, modelId: string, imageName: string, imageTag: string) {
  await checkUserAuth(user, modelId, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${modelId}/${imageName}`, actions: ['pull'] },
  ])

  // get which layers exist for the model
  return await getImageTagManifest(repositoryToken, { namespace: modelId, image: imageName }, imageTag)
}

export async function getImageBlob(user: UserInterface, modelId: string, imageName: string, digest: string) {
  await checkUserAuth(user, modelId, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${modelId}/${imageName}`, actions: ['pull'] },
  ])

  return await getRegistryLayerStream(repositoryToken, { namespace: modelId, image: imageName }, digest)
}

export async function softDeleteImage(user: UserInterface, modelId: string, imageName: string, imageTag: string) {
  // GET the original manifest
  const manifest = await getImageManifest(user, modelId, imageName, imageTag)
  log.debug({ manifest }, 'Got original manifest')

  const allLayers = [manifest.config, ...manifest.layers]
  const softDeleteNamespace = `${config.registry.softDeletePrefix}${modelId}`
  log.debug({ softDeleteNamespace }, 'softDeleteNamespace=')
  const multiRepositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${modelId}/${imageName}`, actions: ['push', 'pull'] },
    { type: 'repository', name: `${softDeleteNamespace}/${imageName}`, actions: ['push', 'pull'] },
  ])

  // cross-mount layers from original to new image
  for (const layer of allLayers) {
    const layerDigest = layer['digest']
    if (!layerDigest || layerDigest.length === 0) {
      throw InternalError('Could not extract layer digest.', { layer, modelId, imageName, imageTag })
    }

    await mountBlob(
      multiRepositoryToken,
      { namespace: modelId, image: imageName },
      { namespace: softDeleteNamespace, image: imageName },
      layerDigest,
    )
  }

  // PUT the new manifest
  const putManifestRes = await putManifest(
    multiRepositoryToken,
    { namespace: softDeleteNamespace, image: imageName },
    imageTag,
    JSON.stringify(manifest),
    manifest['mediaType'],
  )
  log.debug({ putManifestRes }, 'putManifest result')

  // DELETE the original manifest
  const deleteRes = await deleteImage(multiRepositoryToken, { namespace: modelId, image: imageName }, imageTag)
  log.debug({ deleteRes }, 'deleteImage result')
}
