import { Readable } from 'node:stream'

import { BodyInit, HeadersInit, RequestInit } from 'undici-types'

import { getHttpsUndiciAgent } from '../services/http.js'
import log from '../services/log.js'
import { isRegistryError } from '../types/RegistryError.js'
import config from '../utils/config.js'
import { InternalError, RegistryError } from '../utils/error.js'
import {
  isDoesLayerExistResponse,
  isGetImageTagManifestResponse,
  isInitialiseUploadObjectResponse,
  isListImageTagResponse,
  isListModelReposResponse,
  isPutManifestResponse,
  isRegistryErrorResponse,
  isUploadLayerMonolithicResponse,
} from './registryResponses.js'

interface RepoRef {
  namespace: string
  image: string
}

const registry = config.registry.connection.internal

const agent = getHttpsUndiciAgent({
  connect: { rejectUnauthorized: !config.registry.connection.insecure },
})

interface RegistryRequestResult<TBody = unknown> {
  headers: Record<string, string>
  body?: TBody
  stream?: ReadableStream | Readable
  abort: () => void
  status: number
  statusText: string
  url: string
}

async function registryRequest(
  token: string,
  endpoint: string,
  returnRawBody: boolean = false,
  extraFetchOptions: Partial<Omit<RequestInit, 'headers' | 'dispatcher' | 'signal'>> = {},
  extraHeaders: HeadersInit = {},
  pagination?: { traverseLinks?: boolean; start?: string; linkFilter?: string },
): Promise<RegistryRequestResult> {
  const controller = new AbortController()

  const allRepositories: string[] = []
  let paginateParameter = pagination?.start ? pagination.start : ''
  const linkFilter = pagination?.linkFilter ? pagination.linkFilter : ''
  let link: string | null
  let contentType: string
  let res: Response
  let body: any
  let stream: ReadableStream | Readable | undefined

  do {
    const url = `${registry}/v2/${endpoint}${paginateParameter}`
    log.debug({ url }, 'Making request to the registry.')
    try {
      // Note that this `fetch` is from `Node` and not `node-fetch` unlike other places in the codebase.
      // This is because `node-fetch` was incorrectly closing the stream received from `tar` for some (but not all) entries which meant that not all of the streamed data was sent to the registry
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...extraHeaders,
        },
        dispatcher: agent,
        signal: controller.signal,
        ...extraFetchOptions,
      })
    } catch (err) {
      throw InternalError('Unable to communicate with the registry.', { err })
    }

    link = res.headers.get('link') || ''
    contentType = res.headers.get('content-type') || ''

    log.debug(Object.fromEntries(res.headers), 'Headers received from the registry.')

    const linkQueryIndex = link.indexOf('?')
    const linkEndIndex = link.lastIndexOf('>')
    if (link && linkQueryIndex !== -1 && linkEndIndex > linkQueryIndex) {
      paginateParameter = link.substring(linkQueryIndex, linkEndIndex)
    }

    if (returnRawBody) {
      stream = res.body as any
    } else if (contentType.endsWith('json')) {
      // e.g. 'application/json', 'application/vnd.docker.distribution.manifest.v2+json'
      try {
        body = await res.json()
      } catch (err) {
        throw InternalError('Unable to parse response body JSON.', { err })
      }
    } else {
      try {
        body = await res.text()
      } catch (err) {
        throw InternalError('Unable to read non-JSON response body.', { err })
      }
    }

    if (!res.ok) {
      const context = {
        url: res.url,
        status: res.status,
        statusText: res.statusText,
      }

      if (!body && contentType.includes('application/json')) {
        // try to get the json if there's an error, even if we wanted the raw body
        body = await res.json().catch(() => undefined)
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

    if (body?.repositories) {
      allRepositories.push(...body.repositories)
    }
  } while (pagination?.traverseLinks && link && link.includes(linkFilter))

  if (allRepositories.length) {
    body = {
      repositories: allRepositories,
    }
  }

  return {
    headers: res.headers ? Object.fromEntries(res.headers) : {},
    body: returnRawBody ? undefined : body,
    stream: returnRawBody ? stream : undefined,
    abort: () => controller.abort(),
    status: res.status,
    statusText: res.statusText,
    url: res.url,
  }
}

export async function listModelRepos(token: string, modelId: string) {
  const { body } = await registryRequest(token, '_catalog', undefined, undefined, undefined, {
    traverseLinks: true,
    start: `?n=100&last=${modelId}`,
    linkFilter: modelId,
  })
  if (!isListModelReposResponse(body)) {
    throw InternalError('Unrecognised response body when listing model repositories.', { body })
  }

  const filteredRepos = body.repositories.filter((repo) => repo.startsWith(`${modelId}/`))
  return filteredRepos
}

export async function listImageTags(token: string, imageRef: RepoRef) {
  const repo = `${imageRef.namespace}/${imageRef.image}`

  let body: unknown
  try {
    ;({ body } = await registryRequest(token, `${repo}/tags/list`, undefined, undefined, undefined, {
      traverseLinks: true,
    }))
  } catch (error) {
    if (isRegistryError(error) && error.errors.length === 1 && error.errors.at(0)?.code === 'NAME_UNKNOWN') {
      return []
    }
    throw error
  }

  if (!isListImageTagResponse(body)) {
    throw InternalError('Unrecognised response body when listing image tags.', { body })
  }
  return body.tags
}

export async function getImageTagManifest(token: string, imageRef: RepoRef, imageTag: string) {
  // TODO: handle `Accept: 'application/vnd.docker.distribution.manifest.list.v2+json'` type for multi-platform images
  const { body } = await registryRequest(
    token,
    `${imageRef.namespace}/${imageRef.image}/manifests/${imageTag}`,
    undefined,
    undefined,
    {
      Accept: 'application/vnd.docker.distribution.manifest.v2+json',
    },
  )
  if (!isGetImageTagManifestResponse(body)) {
    throw InternalError('Unrecognised response body when getting image tag manifest.', {
      body,
      namespace: imageRef.namespace,
      image: imageRef.image,
      imageTag,
    })
  }
  return body
}

export async function getRegistryLayerStream(
  token: string,
  imageRef: RepoRef,
  layerDigest: string,
): Promise<{ stream: Readable | ReadableStream; abort: () => void }> {
  const { stream, abort } = await registryRequest(
    token,
    `${imageRef.namespace}/${imageRef.image}/blobs/${layerDigest}`,
    true,
    undefined,
    {
      Accept: 'application/vnd.docker.distribution.manifest.v2+json',
    },
  )

  if (!stream || !(stream instanceof ReadableStream || stream instanceof Readable)) {
    abort()
    throw InternalError('Unrecognised response stream when getting image layer blob.', {
      stream,
      namespace: imageRef.namespace,
      image: imageRef.image,
      layerDigest,
    })
  }

  return { stream, abort }
}

export async function doesLayerExist(token: string, imageRef: RepoRef, digest: string) {
  try {
    const { headers } = await registryRequest(token, `${imageRef.namespace}/${imageRef.image}/blobs/${digest}`, true, {
      method: 'HEAD',
    })

    if (!isDoesLayerExistResponse(headers)) {
      throw InternalError('Unrecognised response headers when heading image layer.', {
        headers,
        namespace: imageRef.namespace,
        image: imageRef.image,
        digest,
      })
    }

    return true
  } catch (error) {
    if (typeof error === 'object' && error !== null && error['context']['status'] === 404) {
      // 404 response indicates that the layer does not exist
      return false
    } else {
      throw error
    }
  }
}

export async function initialiseUpload(token: string, imageRef: RepoRef) {
  const { headers } = await registryRequest(token, `${imageRef.namespace}/${imageRef.image}/blobs/uploads/`, true, {
    method: 'POST',
  })

  if (!isInitialiseUploadObjectResponse(headers)) {
    throw InternalError('Unrecognised response headers when posting initialise image upload.', {
      headers,
      namespace: imageRef.namespace,
      image: imageRef.image,
    })
  }

  return headers
}

export async function putManifest(
  token: string,
  imageRef: RepoRef,
  imageTag: string,
  manifest: BodyInit,
  contentType: string,
) {
  const { headers } = await registryRequest(
    token,
    `${imageRef.namespace}/${imageRef.image}/manifests/${imageTag}`,
    true,
    {
      method: 'PUT',
      body: manifest,
    },
    { 'Content-Type': contentType, name: `${imageRef.namespace}/${imageRef.image}`, reference: imageTag },
  )

  if (!isPutManifestResponse(headers)) {
    throw InternalError('Unrecognised response headers when putting image manifest.', {
      headers,
      namespace: imageRef.namespace,
      image: imageRef.image,
    })
  }

  return headers
}

export async function uploadLayerMonolithic(
  token: string,
  uploadURL: string,
  digest: string,
  blob: Readable | ReadableStream,
  size: string,
) {
  const { headers, abort } = await registryRequest(
    token,
    `${uploadURL}&digest=${digest}`.replace(/^(\/v2\/)/, ''),
    true,
    {
      method: 'PUT',
      body: blob,
      duplex: 'half',
      window: null,
      redirect: 'error',
    },
    {
      'content-length': size,
      'content-type': 'application/octet-stream',
    },
  )

  if (!isUploadLayerMonolithicResponse(headers)) {
    abort()
    throw InternalError('Unrecognised response headers when putting image blob.', {
      headers,
      uploadURL,
      digest,
      size,
    })
  }

  return headers
}
