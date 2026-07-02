import { ClientSession } from 'mongoose'

import {
  deleteManifest,
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
import { ImageDigestRef, ImageNameRef, ImageRef, ImageTagRef } from '../models/Release.js'
import ScanModel, { ArtefactKind, ScanInterface, ScanSummary, SeverityLevel } from '../models/Scan.js'
import { UserInterface } from '../models/User.js'
import { Action, issueAccessToken, softDeletePrefix } from '../routes/v1/registryAuth.js'
import { isBailoError } from '../types/error.js'
import { isRegistryError } from '../types/RegistryError.js'
import {
  ArtefactScanStateCounts,
  ImageScanResult,
  ImageTagResult,
  ModelImages,
  ModelImagesWithScanResults,
  SeverityCounts,
} from '../types/types.js'
import { BadReq, Forbidden, InternalError, NotFound } from '../utils/error.js'
import { Descriptors, ImageManifestV2, ManifestListV2, OCIEmptyMediaType } from '../utils/registryResponses.js'
import { platformToString } from '../utils/registryUtils.js'
import { useTransaction } from '../utils/transactions.js'
import { getLayersForImage } from './images/getImageLayers.js'
import log from './log.js'
import { getModelById } from './model.js'
import { findAndDeleteImageFromReleases } from './release.js'

// derived from https://pkg.go.dev/github.com/distribution/reference#pkg-overview
const imageRegex =
  /^(?:(?<domain>(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(?::\d{1,5})|(?:\d{1,3}\.){3}\d{1,3}|\[(?:[0-9A-Fa-f:.]+)\])(?::\d{1,5})?)\/)?(?<path>[a-z0-9]+(?:(?:[_.]|__|-+)[a-z0-9]+)*(?:\/[a-z0-9]+(?:(?:[_.]|__|-+)[a-z0-9]+)*)*)(?::(?<tag>[\w][\w.-]{0,127}))?(?:@(?<digest>[A-Za-z][A-Za-z0-9]*(?:[+.\-_][A-Za-z][A-Za-z0-9]*)*:[0-9a-fA-F]{32,}))?$/

export type DistributionPackageName =
  { domain?: string; path: string; tag: string } | { domain?: string; path: string; digest: string }

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

type ModelImageWithToken = ModelImages[number] & { repositoryToken: string }

export async function listModelImages(
  user: UserInterface,
  modelId: string,
  includeTokens: true,
): Promise<ModelImageWithToken[]>
export async function listModelImages(user: UserInterface, modelId: string, includeTokens?: false): Promise<ModelImages>
export async function listModelImages(
  user: UserInterface,
  modelId: string,
  includeTokens = false,
): Promise<ModelImages | ModelImageWithToken[]> {
  await checkUserAuth(user, modelId, ['list'])

  const registryToken = await issueAccessToken({ dn: user.dn }, [{ type: 'registry', name: 'catalog', actions: ['*'] }])
  const repos = await listModelRepos(registryToken, modelId)

  const results = (
    await Promise.all(
      repos.map(async (repo) => {
        const [repository, name] = repo.split(/\/(.*)/s)
        const repositoryToken = await issueAccessToken({ dn: user.dn }, [
          { type: 'repository', name: repo, actions: ['pull'] },
        ])
        const tags = await listImageTags(repositoryToken, { repository, name })
        return { repository, name, tags, repositoryToken }
      }),
    )
  )
    // Docker Distribution Registry does not remove empty repositories so filter out repos that have no remaining tags.
    .filter((repo) => repo.tags && repo.tags.length > 0)

  if (includeTokens) {
    return results
  }
  return results.map(({ repositoryToken: _token, ...img }) => img)
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
    ArtefactScanState.Skipped,
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
  imageRef: ImageTagRef,
  digest?: string,
): Promise<ImageTagResult> {
  const repositoryToken = await issueAccessToken({ dn: user.dn }, [
    {
      type: 'repository',
      name: `${imageRef.repository}/${imageRef.name}`,
      actions: ['pull'],
    },
  ])

  const { body, headers } = await getImageTagManifests(repositoryToken, imageRef)

  if (!body) {
    throw InternalError('Missing manifest list body.', { imageRef })
  }

  let platform: string | undefined

  let layerRef: ImageRef
  if ('manifests' in body) {
    if (!digest) {
      throw BadReq('Must provide digest for multiplatform image', { imageRef })
    }

    const manifest = body.manifests.find((manifest) => manifest.digest === digest)

    if (!manifest) {
      throw BadReq('Digest does not exist in manifest list', { imageRef, digest })
    }

    platform = platformToString(manifest.platform)

    if (!platform) {
      throw BadReq('Manifest entry missing platform metadata', { imageRef, platform, digest })
    }
    layerRef = { repository: imageRef.repository, name: imageRef.name, digest }
  } else {
    layerRef = { repository: imageRef.repository, name: imageRef.name, tag: imageRef.tag }
  }

  const layers = await getLayersForImage(repositoryToken, layerRef)

  const scanResults = await getScansFromLayers(layers, true)

  return { tag: imageRef.tag, digest: headers['docker-content-digest'], platform, ...scanResults }
}

export async function listModelImagesWithScanResults(
  user: UserInterface,
  modelId: string,
): Promise<ModelImagesWithScanResults[]> {
  const modelImagesWithToken = await listModelImages(user, modelId, true)

  return Promise.all(
    modelImagesWithToken.map(async ({ repositoryToken, ...img }) => {
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
                  const layers = await getLayersForImage(repositoryToken, { ...img, digest: manifest.digest })
                  const scan = await getScansFromLayers(layers)

                  return {
                    tag,
                    digest: manifest.digest,
                    platform: platformToString(manifest.platform),
                    ...scan,
                  }
                }),
              )
            }

            const layers = await getLayersForImage(repositoryToken, { ...img, tag }, manifestResponse.body)

            const scan = await getScansFromLayers(layers)

            return [{ tag, digest: manifestResponse.headers['docker-content-digest'], ...scan }]
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
    if (typeof item !== 'string' && 'severity' in item) {
      acc[item.severity]++
    }
    return acc
  }, initial)
}

export async function getImageBlob(user: UserInterface, repoRef: ImageNameRef, digest: string) {
  await checkUserAuth(user, repoRef.repository, ['pull'])

  const repositoryToken = await issueAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${repoRef.repository}/${repoRef.name}`, actions: ['pull'] },
  ])

  return await getRegistryLayerStream(repositoryToken, repoRef, digest)
}

async function getTagDigestReferenceMap(
  token: string,
  repository: string,
  name: string,
): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>()

  let tags: string[]
  try {
    tags = await listImageTags(token, { repository, name })
  } catch (err) {
    if (!isBailoError(err) || err?.context?.status !== 404) {
      throw err
    }
    return map
  }

  await Promise.all(
    tags.map(async (tag) => {
      const refs = new Set<string>()
      const { body, headers } = await getImageTagManifests(token, { repository, name, tag })
      const rootDigest = headers['docker-content-digest']
      if (rootDigest) {
        refs.add(rootDigest)
      }
      if (body && 'manifests' in body) {
        for (const manifest of body.manifests) {
          if (manifest.digest) {
            refs.add(manifest.digest)
          }
        }
      }
      map.set(tag, refs)
    }),
  )

  return map
}

async function renameStandardManifest(
  source: ImageTagRef,
  destination: ImageTagRef,
  manifestBody: ImageManifestV2,
  multiRepositoryToken: string,
  sourceDigest: string,
) {
  const allLayers = [manifestBody.config, ...manifestBody.layers]

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
  const mediaType = manifestBody.mediaType == OCIEmptyMediaType ? manifestBody.artifactType : manifestBody.mediaType
  await putManifest(multiRepositoryToken, destination, JSON.stringify(manifestBody), mediaType)
  log.trace({ source }, 'Deleting the original manifest.')
  await deleteManifest(multiRepositoryToken, source)

  let isOrphaned = true
  try {
    const remainingImages = await listImageTags(multiRepositoryToken, {
      repository: source.repository,
      name: source.name,
    })
    for (const tag of remainingImages) {
      const tagHeaders = (
        await getImageTagManifests(multiRepositoryToken, {
          repository: source.repository,
          name: source.name,
          tag: tag,
        })
      ).headers
      if (sourceDigest === tagHeaders['docker-content-digest']) {
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
      digest: sourceDigest,
    })
  }
}

async function renameMultiManifest(
  source: ImageTagRef,
  destination: ImageTagRef,
  manifestBody: ManifestListV2,
  multiRepositoryToken: string,
  sourceDigest: string,
) {
  const allRefsMap = await getTagDigestReferenceMap(multiRepositoryToken, source.repository, source.name)
  allRefsMap.delete(source.tag)
  const otherRefs = new Set<string>()
  for (const refs of allRefsMap.values()) {
    for (const digest of refs) {
      otherRefs.add(digest)
    }
  }
  const listIsOrphaned = !otherRefs.has(sourceDigest)

  const tmpTags: string[] = []
  const updatedManifestBody = structuredClone(manifestBody)
  try {
    for (const manifest of updatedManifestBody.manifests) {
      const digestRef: ImageDigestRef = {
        repository: source.repository,
        name: source.name,
        digest: manifest.digest,
      }

      const { body: childManifest } = await getImageTagManifests(multiRepositoryToken, digestRef)
      if (!childManifest || 'manifests' in childManifest) {
        throw InternalError('Platform manifest missing.', { digestRef })
      }

      const layers = [childManifest.config, ...childManifest.layers]

      for (const layer of layers) {
        await mountBlob(
          multiRepositoryToken,
          { repository: source.repository, name: source.name },
          { repository: destination.repository, name: destination.name },
          layer.digest,
        )
      }

      // A temp tag is required because PUT-by-digest fails (the JSON is re-serialised, changing its canonical bytes)
      // so we create the digest via a tag and then delete the tag (leaving the new digest)
      const tmpTag = `__bailo_tmp_${crypto.randomUUID()}__`
      // NOTE: Temp tags may remain if process crashes before cleanup.
      // These are safe but should be periodically garbage-collected.
      log.debug(
        { image: { repository: destination.repository, name: destination.name, tag: tmpTag } },
        'PUT manifest with temporary tag in registry',
      )
      tmpTags.push(tmpTag)
      const childPutManifestRes = await putManifest(
        multiRepositoryToken,
        { repository: destination.repository, name: destination.name, tag: tmpTag },
        JSON.stringify(childManifest),
        childManifest.mediaType === OCIEmptyMediaType ? childManifest.artifactType! : childManifest.mediaType!,
      )

      const newDigest = childPutManifestRes['docker-content-digest']
      if (!newDigest) {
        throw InternalError('Child manifest digest missing after PUT', { tmpTag })
      }

      // Only delete the child platform manifest if no other tag references it
      // (either as a root digest or as a child platform digest)
      const platformIsOrphaned = !otherRefs.has(manifest.digest)

      if (platformIsOrphaned) {
        log.trace(
          { source, childDigest: manifest.digest },
          'Child platform manifest is orphaned; deleting from source repository.',
        )
        await deleteManifest(multiRepositoryToken, {
          repository: source.repository,
          name: source.name,
          digest: manifest.digest,
        })
      } else {
        log.trace(
          { source, childDigest: manifest.digest },
          'Child platform manifest is still referenced by another tag; preserving.',
        )
      }

      // overwrite digest to point to new child manifest
      manifest.digest = newDigest
    }

    // PUT root manifest
    await putManifest(
      multiRepositoryToken,
      destination,
      JSON.stringify(updatedManifestBody),
      updatedManifestBody.mediaType!,
    )

    // delete original root manifest
    await deleteManifest(multiRepositoryToken, source)

    if (listIsOrphaned) {
      log.trace({ source }, 'Deleting orphaned digest, to prevent pulling.')
      await deleteManifest(multiRepositoryToken, {
        repository: source.repository,
        name: source.name,
        digest: sourceDigest,
      })
    }

    /**
     * Note: Docker Distribution (registry:3.x) does not auto-delete empty repositories.
     * If this removes the last manifest, the repo namespace may remain until registry garbage collection runs.
     */
  } finally {
    // always cleanup temp tags
    for (const tmpTag of tmpTags) {
      try {
        log.debug(
          { image: { repository: destination.repository, name: destination.name, tag: tmpTag } },
          'DELETE manifest with temporary tag in registry',
        )
        // remove temp tag, which leaves the digest in place if still referenced by another manifest
        await deleteManifest(multiRepositoryToken, {
          repository: destination.repository,
          name: destination.name,
          tag: tmpTag,
        })
      } catch (cleanupErr) {
        log.warn({ tmpTag, cleanupErr }, 'Failed to cleanup temp tag')
      }
    }
  }
}

/**
 * Renames an image in the registry.
 *
 * @remarks
 * This does _not_ also update any mongo data, and does _not_ do any auth checks on the source or destination.
 */
export async function renameImage(user: UserInterface, source: ImageTagRef, destination: ImageTagRef) {
  const multiRepositoryToken = await issueAccessToken({ dn: user.dn }, [
    { type: 'repository', name: `${source.repository}/${source.name}`, actions: ['push', 'pull', 'delete'] },
    { type: 'repository', name: `${destination.repository}/${destination.name}`, actions: ['push', 'pull', 'delete'] },
  ])

  let manifest: Awaited<ReturnType<typeof getImageTagManifests>>
  try {
    manifest = await getImageTagManifests(multiRepositoryToken, source)
  } catch (err) {
    if (err && isRegistryError(err) && err?.context?.status === 404) {
      throw NotFound('The requested image was not found.', { ...source })
    }
    throw err
  }

  if (!manifest.body) {
    throw InternalError('The registry returned a response but the body was missing.', { source })
  }

  const sourceDigest = manifest.headers['docker-content-digest']
  if (!sourceDigest) {
    throw InternalError('The registry returned a response but the source digest header was missing.', {
      source,
      headers: manifest.headers,
    })
  }

  if ('manifests' in manifest.body) {
    await renameMultiManifest(source, destination, manifest.body, multiRepositoryToken, sourceDigest)
  } else {
    await renameStandardManifest(source, destination, manifest.body, multiRepositoryToken, sourceDigest)
  }
}

export async function softDeleteImage(
  user: UserInterface,
  imageRef: ImageTagRef,
  deleteMirroredModel: boolean = false,
  session?: ClientSession,
) {
  const model = await getModelById(user, imageRef.repository)
  if (EntryKind.MirroredModel === model.kind && !deleteMirroredModel) {
    throw BadReq('Cannot remove image from a mirrored model.')
  }

  await checkUserAuth(user, imageRef.repository, ['push', 'pull', 'delete'])

  const softDeleteNamespace = `${softDeletePrefix}/${imageRef.repository}`

  async function deleteOperation(tx: ClientSession | undefined) {
    await findAndDeleteImageFromReleases(user, imageRef.repository, imageRef, tx)
    await renameImage(user, imageRef, { repository: softDeleteNamespace, name: imageRef.name, tag: imageRef.tag })
  }
  if (session) {
    await deleteOperation(session)
  } else {
    await useTransaction([deleteOperation])
  }
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
  imageRef: ImageTagRef,
  restoreMirroredModel: boolean = false,
) {
  const model = await getModelById(user, imageRef.repository)
  if (EntryKind.MirroredModel === model.kind && !restoreMirroredModel) {
    throw BadReq('Cannot restore image to a mirrored model.')
  }

  await checkUserAuth(user, imageRef.repository, ['push', 'pull', 'delete'])

  const softDeleteNamespace = `${softDeletePrefix}/${imageRef.repository}`
  await renameImage(user, { repository: softDeleteNamespace, name: imageRef.name, tag: imageRef.tag }, imageRef)
}
