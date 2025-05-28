import fetch, { Response } from 'node-fetch'

import { isRegistryErrorResponse, listImageTags } from '../clients/registry.js'
import { getAccessToken } from '../routes/v1/registryAuth.js'
import { getHttpsAgent } from '../services/http.js'
import log from '../services/log.js'
import { isRegistryError } from '../types/RegistryError.js'
import config from '../utils/config.js'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database.js'
import { InternalError, RegistryError } from '../utils/error.js'

const httpsAgent = getHttpsAgent({
  rejectUnauthorized: !config.registry.insecure,
})

const registry = `https://localhost:5000/v2`

const digestsToSearchFor: string[] = []

async function getRepositories(): Promise<string[]> {
  const token = await getAccessToken({ dn: 'user' }, [{ type: 'registry', class: '', name: 'catalog', actions: ['*'] }])

  const authorisation = `Bearer ${token}`

  const res: Response = await fetch(`${registry}/_catalog`, {
    headers: {
      Authorization: authorisation,
    },
    agent: httpsAgent,
  })

  const catalog = (await res.json()) as object

  return catalog['repositories']
}

async function getTags(repository: string): Promise<string[]> {
  const repositoryToken = await getAccessToken({ dn: 'user' }, [
    { type: 'repository', class: '', name: repository, actions: ['*'] },
  ])

  const tags = listImageTags(repositoryToken, { namespace: registry, image: repository })
  return tags
}

async function getTagDigests(
  repository: string,
  tag: string,
): Promise<{ manifest: string; image: string; layers: string[] }> {
  const repositoryToken = await getAccessToken({ dn: 'user' }, [
    { type: 'repository', class: '', name: repository, actions: ['*'] },
  ])
  const repositoryAuthorisation = `Bearer ${repositoryToken}`

  const res: Response = await fetch(`${registry}/${repository}/manifests/${tag}`, {
    headers: {
      Authorization: repositoryAuthorisation,
      Accept: 'application/vnd.docker.distribution.manifest.v2+json',
    },
    agent: httpsAgent,
  })
  const body = (await res.json()) as object

  if (!res.ok) {
    const context = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
    }
    if (isRegistryErrorResponse(body)) {
      throw RegistryError(body, context)
    } else {
      throw InternalError('Unrecognised response returned by the registry.', {
        ...context,
        body: JSON.stringify(body),
      })
    }
  }
  const dockerContentDigest = res.headers.get('docker-content-digest') || ''

  return {
    manifest: dockerContentDigest.replace('sha256:', ''),
    image: body['config']['digest'].replace('sha256:', ''),
    layers: body['layers'].map((layerInfo) => layerInfo['digest'].replace('sha256:', '')),
  }
}

async function script() {
  await connectToMongoose()

  const repositories = await getRepositories()
  log.info('Retrieved repositories', { amount: repositories.length })

  const affectedImages: {
    modelId: string
    image: string
    tag: string
    digest: string
    digestType: 'manifest' | 'layer' | 'image'
  }[] = []

  const foundDigests: Set<string> = new Set()

  for (const repository of repositories) {
    const [modelId, image] = repository.split('/')
    const tags = await getTags(repository)
    let a
    log.info('Retrieved tags for repository', { amount: tags.length, tags })
    for (const tag of tags) {
      const b = { modelId, image, tag }
      try {
        a = await getTagDigests(repository, tag)
      } catch (error) {
        if (isRegistryError(error) && error.errors.at(0)?.code === 'MANIFEST_UNKNOWN') {
          const registryError = error.errors.at(0)
          if (!registryError) {
            throw error
          }
          const detail = registryError.detail
          const digest = detail.slice(detail.indexOf('sha256:') + 'sha256:'.length)
          affectedImages.push({ ...b, digest: digest, digestType: 'manifest' })
          foundDigests.add(digest)
          continue
        }
      }
      if (digestsToSearchFor.includes(a.manifest)) {
        affectedImages.push({ ...b, digest: a.manifest, digestType: 'manifest' })
        foundDigests.add(a.manifest)
      }
      if (digestsToSearchFor.includes(a.image)) {
        affectedImages.push({ ...b, digest: a.image, digestType: 'image' })
        foundDigests.add(a.image)
      }
      for (const layer of a.layers) {
        if (digestsToSearchFor.includes(layer)) {
          affectedImages.push({ ...b, digest: layer, digestType: 'layer' })
          foundDigests.add(layer)
        }
      }
    }
  }
  const digestsNotFound = digestsToSearchFor.filter((digest) => !foundDigests.has(digest))

  log.info(affectedImages, 'Affected Images.')
  log.info('Warning: If manifest data is missing, the image and layer will not be able to be checked.')
  log.info(digestsNotFound, 'Digests not found')

  setTimeout(disconnectFromMongoose, 50)
}

await script()
