import { ClientSession } from 'mongoose'

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
import { Action, getAccessToken, softDeletePrefix } from '../routes/v1/registryAuth.js'
import { isBailoError } from '../types/error.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../utils/error.js'
import log from './log.js'
import { getModelById } from './model.js'
import { findAndDeleteImageFromReleases } from './release.js'

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

export async function checkUserAuth(user: UserInterface, modelId: string, actions: Action[] = []) {
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

/**
 * Renames an image in the registry.
 *
 * @remarks
 * This does _not_ also update any mongo data, and does _not_ do any auth checks on the destination.
 */
export async function renameImage(user: UserInterface, source: ImageRefInterface, destination: ImageRefInterface) {
  let manifest: Awaited<ReturnType<typeof getImageManifest>>
  try {
    manifest = await getImageManifest(user, source)
  } catch (err) {
    // special case for 404 not found
    if (err && isBailoError(err) && err?.context?.status === 404) {
      throw NotFound('The requested image was not found.', { ...source })
    }
    throw err
  }

  const allLayers = [manifest.body!.config, ...manifest.body!.layers]
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
    log.trace(
      {
        layerDigest,
        source: { repository: source.repository, name: source.name },
        destination: { repository: destination.repository, name: destination.name },
      },
      'CrossMounting registry layer to new repository.',
    )

    await mountBlob(
      multiRepositoryToken,
      { repository: source.repository, name: source.name },
      { repository: destination.repository, name: destination.name },
      layerDigest,
    )
  }

  log.trace({ destination }, 'Creating a new manifest for cross mounted repository.')
  await putManifest(multiRepositoryToken, destination, JSON.stringify(manifest.body), manifest.body!.mediaType!)
  log.trace({ source }, 'Deleting the original manifest.')
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
      if (manifest.headers['docker-content-digest'] === tagHeaders['docker-content-digest']) {
        isOrphaned = false
        log.trace({ source }, "Found another tag matching digest. Won't delete digest.")
        break
      }
    }
  } catch (err) {
    // error 404 is thrown by listImageTags when no tags remain but the digest still exists
    if (!err || !isBailoError(err) || err?.context?.status !== 404) {
      throw err
    }
  }

  if (isOrphaned) {
    log.trace({ source }, 'Deleting orphaned digest, to prevent pulling.')
    await deleteManifest(multiRepositoryToken, {
      repository: source.repository,
      name: source.name,
      tag: manifest.headers['docker-content-digest'] as string,
    })
  }
}

export async function softDeleteImage(
  user: UserInterface,
  imageRef: ImageRefInterface,
  deleteMirroredModel: boolean = false,
  session?: ClientSession | undefined,
) {
  const model = await getModelById(user, imageRef.repository)
  if (model.settings?.mirror?.sourceModelId && !deleteMirroredModel) {
    throw BadReq('Cannot remove image from a mirrored model.')
  }

  await checkUserAuth(user, imageRef.repository, ['push', 'pull', 'delete'])

  const softDeleteNamespace = `${softDeletePrefix}${imageRef.repository}`
  await renameImage(user, imageRef, { repository: softDeleteNamespace, name: imageRef.name, tag: imageRef.tag })

  await findAndDeleteImageFromReleases(user, imageRef.repository, imageRef, session)
}
