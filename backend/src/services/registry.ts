import {
  deleteManifest,
  getImageTagManifest,
  getRegistryLayerStream,
  listImageTags,
  listModelRepos,
  mountBlob,
  putManifest,
} from '../clients/registry.js'
import authorisation from '../connectors/authorisation/index.js'
import { ImageRefInterface, RepoRefInterface } from '../models/Release.js'
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
  log.debug({ repos }, 'listModelRepos()=')
  return await Promise.all(
    repos.map(async (repo) => {
      const [repository, name] = repo.split(/\/(.*)/s)
      const repositoryToken = await getAccessToken({ dn: user.dn }, [
        { type: 'repository', name: repo, actions: ['pull'] },
      ])
      return { repository, name, tags: await listImageTags(repositoryToken, { repository, name }) }
    }),
  )
}

export async function getImageManifest(user: UserInterface, imageRef: ImageRefInterface) {
  await checkUserAuth(user, imageRef.repository, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${imageRef.repository}/${imageRef.name}`, actions: ['pull'] },
  ])

  // get which layers exist for the model
  return await getImageTagManifest(repositoryToken, imageRef)
}

export async function getImageBlob(user: UserInterface, repoRef: RepoRefInterface, digest: string) {
  await checkUserAuth(user, repoRef.repository, ['pull'])

  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${repoRef.repository}/${repoRef.name}`, actions: ['pull'] },
  ])

  return await getRegistryLayerStream(repositoryToken, repoRef, digest)
}

async function renameImage(user: UserInterface, source: ImageRefInterface, destination: ImageRefInterface) {
  const manifest = await getImageManifest(user, source)

  const allLayers = [manifest.body.config, ...manifest.body.layers]
  const multiRepositoryToken = await getAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${source.repository}/${source.name}`, actions: ['push', 'pull', 'delete'] },
    { type: 'repository', name: `${destination.repository}/${destination.name}`, actions: ['push', 'pull'] },
  ])

  // cross-mount layers from original to new image
  for (const layer of allLayers) {
    const layerDigest = layer['digest']
    if (!layerDigest || layerDigest.length === 0) {
      throw InternalError('Could not extract layer digest.', { layer, from: source, to: destination })
    }

    await mountBlob(
      multiRepositoryToken,
      { repository: source.repository, name: source.name },
      { repository: destination.repository, name: destination.name },
      layerDigest,
    )
  }

  // PUT the new manifest
  const putManifestRes = await putManifest(
    multiRepositoryToken,
    destination,
    JSON.stringify(manifest.body),
    manifest.body['mediaType'],
  )
  log.debug({ putManifestRes }, 'putManifest result')

  // DELETE the original manifest
  await deleteManifest(multiRepositoryToken, source)

  let isOrphaned = true
  try {
    const remainingImages = await listImageTags(multiRepositoryToken, {
      repository: source.repository,
      name: source.name,
    })
    for (const tag of remainingImages) {
      const tagHeaders = (await getImageManifest(user, { repository: source.repository, name: source.name, tag: tag }))
        .headers
      if (manifest.headers['Docker-Content-Digest'] === tagHeaders['Docker-Content-Digest']) {
        isOrphaned = false
        break
      }
    }
  } catch (err) {
    if (!err || err['status'] !== '404') {
      throw err
    }
  }

  if (isOrphaned) {
    await deleteManifest(multiRepositoryToken, {
      repository: source.repository,
      name: source.name,
      tag: manifest.headers['Docker-Content-Digest'],
    })
  }
}

export async function softDeleteImage(user: UserInterface, imageRef: ImageRefInterface) {
  const softDeleteNamespace = `${config.registry.softDeletePrefix}${imageRef.repository}`
  log.debug({ softDeleteNamespace }, 'softDeleteNamespace=')

  await renameImage(user, imageRef, { repository: softDeleteNamespace, name: imageRef.name, tag: imageRef.tag })

  //TODO: update the Model Release docs
}
