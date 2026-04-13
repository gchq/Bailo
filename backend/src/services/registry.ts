import { ClientSession } from 'mongoose'

import {
  deleteManifest,
  getImageTagManifest,
  getImageTagManifests,
  getRegistryLayerStream,
  listImageTags,
  listModelRepos,
  mountBlob,
  putManifest,
} from '../clients/registry.js'
import { ArtefactScanState } from '../connectors/artefactScanning/Base.js'
import authorisation from '../connectors/authorisation/index.js'
import { EntryKind } from '../models/Model.js'
import { ImageRefInterface, RepoRefInterface } from '../models/Release.js'
import ScanModel, { ArtefactKind, ScanInterface, ScanSummary, SeverityLevel } from '../models/Scan.js'
import { UserInterface } from '../models/User.js'
import { Action, getAccessToken, softDeletePrefix } from '../routes/v1/registryAuth.js'
import { isBailoError } from '../types/error.js'
import {
  ArtefactScanStateCounts,
  ImageScanResult,
  ImageTagResult,
  ModelImages,
  ModelImagesWithScanResults,
  SeverityCounts,
} from '../types/types.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../utils/error.js'
import { Descriptors, OCIEmptyMediaType } from '../utils/registryResponses.js'
import { platformToString } from '../utils/registryUtils.js'
import { getLayersForImageTag } from './images/getImageLayers.js'
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

export async function listModelImages(user: UserInterface, modelId: string): Promise<ModelImages> {
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

export async function getScansFromLayers(
  layers: Descriptors[],
  includeFullDetail: boolean = false,
): Promise<ImageScanResult> {
  const layerDigests = layers.map((layer) => layer.digest)

  const scans = await ScanModel.find({
    artefactKind: ArtefactKind.IMAGE,
    layerDigest: { $in: layerDigests },
  })
    .lean<ScanInterface[]>()
    .exec()

  const initialState = Object.fromEntries(
    Object.values(ArtefactScanState).map((state) => [state, 0]),
  ) as ArtefactScanStateCounts

  const stateCounts = scans.reduce<ArtefactScanStateCounts>((acc, scan) => {
    acc[scan.state]++
    return acc
  }, initialState)

  const statePriority = [
    ArtefactScanState.Error,
    ArtefactScanState.InProgress,
    ArtefactScanState.NotScanned,
    ArtefactScanState.Complete,
  ]

  const state = statePriority.find((s) => stateCounts[s] > 0) ?? ArtefactScanState.NotScanned

  return {
    state,
    severityCounts: countSeverities(scans.flatMap((s) => s.summary || [])),

    ...(includeFullDetail && {
      scanResults: scans,
    }),

    imageSize: layers.reduce((acc, obj) => acc + obj.size, 0),
  }
}

export async function getModelImageWithScanResults(
  user: UserInterface,
  imageRef: ImageRefInterface,
  platform?: string,
): Promise<ImageTagResult> {
  const repositoryToken = await getAccessToken({ dn: user.dn }, [
    {
      type: 'repository',
      name: `${imageRef.repository}/${imageRef.name}`,
      actions: ['pull'],
    },
  ])

  const { body } = await getImageTagManifests(repositoryToken, imageRef)

  if (!body || !('manifests' in body)) {
    throw InternalError('Missing manifest list body.', { imageRef })
  }

  const digest = body.manifests.find((manifest) => platformToString(manifest.platform) == platform)?.digest

  if (digest === undefined) {
    throw BadReq('Invalid or unsupported platform for this image', { imageRef, platform })
  }

  const layers = await getLayersForImageTag(repositoryToken, { ...imageRef, tag: digest })

  const scanResults = await getScansFromLayers(layers, true)

  return { tag: imageRef.tag, platform, ...scanResults }
}

export async function listModelImagesWithScanResults(
  user: UserInterface,
  modelId: string,
): Promise<ModelImagesWithScanResults[]> {
  const modelImages = await listModelImages(user, modelId)

  return Promise.all(
    modelImages.map(async (img) => {
      const repositoryToken = await getAccessToken({ dn: user.dn }, [
        {
          type: 'repository',
          name: `${img.repository}/${img.name}`,
          actions: ['pull'],
        },
      ])

      const scanSummaries = (
        await Promise.all(
          img.tags.map(async (tag) => {
            const manifestResponse = await getImageTagManifests(repositoryToken, { ...img, tag })

            if (!manifestResponse.body) {
              return []
            }

            if ('manifests' in manifestResponse.body) {
              return Promise.all(
                manifestResponse.body.manifests.map(async (manifest) => {
                  const layers = await getLayersForImageTag(repositoryToken, { ...img, tag: manifest.digest })
                  const scan = await getScansFromLayers(layers)

                  return {
                    ...scan,
                    platform: platformToString(manifest.platform),
                    tag,
                  }
                }),
              )
            }

            const layers = await getLayersForImageTag(repositoryToken, { ...img, tag })

            const scan = await getScansFromLayers(layers)

            return [{ ...scan, tag }]
          }),
        )
      )
        .flat()
        .filter((r) => r.state !== ArtefactScanState.NotScanned)

      return {
        ...img,
        scanSummaries,
      }
    }),
  )
}

function countSeverities(scanSummary: ScanSummary): SeverityCounts {
  const initial = Object.fromEntries(Object.values(SeverityLevel).map((severity) => [severity, 0])) as SeverityCounts

  return scanSummary.reduce((acc, item) => {
    if ('severity' in item) {
      acc[item.severity]++
    }
    return acc
  }, initial)
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
 * This does _not_ also update any mongo data, and does _not_ do any auth checks on the source or destination.
 */
export async function renameImage(user: UserInterface, source: ImageRefInterface, destination: ImageRefInterface) {
  let manifest: Awaited<ReturnType<typeof getImageManifest>>
  try {
    const repositoryToken = await getAccessToken({ dn: user.dn }, [
      { type: 'repository', name: `${source.repository}/${source.name}`, actions: ['pull'] },
    ])
    manifest = await getImageTagManifest(repositoryToken, source)
  } catch (err) {
    // special case for 404 not found
    if (err && isBailoError(err) && err?.context?.status === 404) {
      throw NotFound('The requested image was not found.', { ...source })
    }
    throw err
  }
  if (!manifest.body) {
    throw InternalError('The registry returned a response but the body was missing.', { ...source, manifest })
  }

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
  const mediaType = manifest.body.mediaType == OCIEmptyMediaType ? manifest.body.artifactType : manifest.body.mediaType
  await putManifest(multiRepositoryToken, destination, JSON.stringify(manifest.body), mediaType)
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
  session?: ClientSession,
) {
  const model = await getModelById(user, imageRef.repository)
  if (EntryKind.MirroredModel === model.kind && !deleteMirroredModel) {
    throw BadReq('Cannot remove image from a mirrored model.')
  }

  await checkUserAuth(user, imageRef.repository, ['push', 'pull', 'delete'])

  const softDeleteNamespace = `${softDeletePrefix}${imageRef.repository}`
  await renameImage(user, imageRef, { repository: softDeleteNamespace, name: imageRef.name, tag: imageRef.tag })

  await findAndDeleteImageFromReleases(user, imageRef.repository, imageRef, session)
  /**
   * TODO: add a scheduled deletion of `ScanModel`s.
   *
   * Approach:
   * - Before deleting/renaming an image, record all layer digests from its manifest.
   * - Schedule a cleanup task to run after the registry's Garbage Collector (GC) window.
   * - For each recorded layer digest:
   *   - `HEAD` the blob in the registry.
   *   - If the blob returns 404, treat the layer as orphaned and delete any
   *     corresponding `ScanModel`s.
   *
   * Notes:
   * - Blob existence does not guarantee the layer is still referenced; this is
   *   best-effort cleanup and relies on registry GC behaviour.
   * - Cleanup must be delayed to avoid false positives before GC has run.
   */
}

export async function restoreSoftDeletedImage(
  user: UserInterface,
  imageRef: ImageRefInterface,
  restoreMirroredModel: boolean = false,
) {
  const model = await getModelById(user, imageRef.repository)
  if (EntryKind.MirroredModel === model.kind && !restoreMirroredModel) {
    throw BadReq('Cannot restore image to a mirrored model.')
  }

  await checkUserAuth(user, imageRef.repository, ['push', 'pull', 'delete'])

  const softDeleteNamespace = `${softDeletePrefix}${imageRef.repository}`
  await renameImage(user, { repository: softDeleteNamespace, name: imageRef.name, tag: imageRef.tag }, imageRef)
}
