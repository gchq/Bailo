import { Readable, Stream } from 'node:stream'

import { getHttpsUndiciAgent } from '../services/http.js'
import log from '../services/log.js'
import { isRegistryError } from '../types/RegistryError.js'
import config from '../utils/config.js'
import { InternalError, RegistryError } from '../utils/error.js'
import { hasKeys, hasKeysOfType } from '../utils/typeguards.js'

interface RepoRef {
  namespace: string
  image: string
}

export type RegistryErrorResponse = {
  errors: Array<ErrorInfo>
}

export type ErrorInfo = { code: string; message: string; detail: string }

const registry = config.registry.connection.internal

const agent = getHttpsUndiciAgent({
  connect: { rejectUnauthorized: !config.registry.connection.insecure },
})

async function registryRequest(
  token: string,
  endpoint: string,
  returnRawBody: boolean = false,
  extraFetchOptions: { [key: string]: any } = {},
  extraHeaders: { [key: string]: string } = {},
) {
  let res: Response
  try {
    // Note that this `fetch` is from `Node` and not `node-fetch` unlike other places in the codebase.
    // This is because `node-fetch` was incorrectly closing the stream received from `tar` for some (but not all) entries which meant that not all of the streamed data was sent to the registry
    res = await fetch(`${registry}/v2/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...extraHeaders,
      },
      dispatcher: agent,
      ...extraFetchOptions,
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the registry.', { err })
  }
  let body
  const headers = res.headers
  // don't get the json if the response raw (e.g. for a stream) and is ok
  if (!returnRawBody) {
    try {
      body = await res.json()
    } catch (err) {
      throw InternalError('Unable to parse response body JSON.', { err })
    }
  }
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

  if (returnRawBody) {
    return { res, headers }
  } else {
    return { body, headers }
  }
}

// Currently limited to a maximum 100 image names
type ListModelReposResponse = { repositories: Array<string> }
export async function listModelRepos(token: string, modelId: string) {
  const responseBody = (await registryRequest(token, `_catalog?n=100&last=${modelId}`)).body
  if (!isListModelReposResponse(responseBody)) {
    throw InternalError('Unrecognised response body when listing model repositories.', { responseBody: responseBody })
  }

  const filteredRepos = responseBody.repositories.filter((repo) => repo.startsWith(`${modelId}/`))
  return filteredRepos
}

function isListModelReposResponse(resp: unknown): resp is ListModelReposResponse {
  return (
    hasKeysOfType<ListModelReposResponse>(resp, { repositories: 'object' }) &&
    Array.isArray(resp['repositories']) &&
    resp['repositories'].every((repo: unknown) => typeof repo === 'string')
  )
}

type ListImageTagResponse = { tags: Array<string> }
export async function listImageTags(token: string, imageRef: RepoRef) {
  const repo = `${imageRef.namespace}/${imageRef.image}`

  let responseBody
  try {
    responseBody = (await registryRequest(token, `${repo}/tags/list`)).body
  } catch (error) {
    if (isRegistryError(error) && error.errors.length === 1 && error.errors.at(0)?.code === 'NAME_UNKNOWN') {
      return []
    }
    throw error
  }

  if (!isListImageTagResponse(responseBody)) {
    throw InternalError('Unrecognised response body when listing image tags.', { responseBody: responseBody })
  }
  return responseBody.tags
}

function isListImageTagResponse(resp: unknown): resp is ListImageTagResponse {
  return (
    hasKeysOfType<ListImageTagResponse>(resp, { tags: 'object' }) &&
    Array.isArray(resp['tags']) &&
    resp['tags'].every((repo: unknown) => typeof repo === 'string')
  )
}

export function isRegistryErrorResponse(resp: unknown): resp is RegistryErrorResponse {
  return (
    hasKeys<{ errors: unknown }>(resp, ['errors']) &&
    Array.isArray(resp['errors']) &&
    resp['errors'].every(
      (e) =>
        hasKeysOfType<ErrorInfo>(e, { code: 'string', message: 'string', detail: 'object' }) &&
        Array.isArray(e['detail']),
    )
  )
}

type GetImageTagManifestResponse = {
  schemaVersion: number
  mediaType: string
  config: { mediaType: string; size: number; digest: string }
  layers: { mediaType: string; size: number; digest: string }[]
}
export async function getImageTagManifest(token: string, imageRef: RepoRef, imageTag: string) {
  // TODO: handle `Accept: 'application/vnd.docker.distribution.manifest.list.v2+json'` type for multi-platform images
  const { body: responseBody, headers: responseHeaders } = await registryRequest(
    token,
    `${imageRef.namespace}/${imageRef.image}/manifests/${imageTag}`,
    false,
    {},
    {
      Accept: 'application/vnd.docker.distribution.manifest.v2+json',
    },
  )
  if (!isGetImageTagManifestResponse(responseBody)) {
    throw InternalError('Unrecognised response body when getting image tag manifest.', {
      responseBody,
      namespace: imageRef.namespace,
      image: imageRef.image,
      imageTag,
    })
  }
  return { responseBody, responseHeaders }
}

function isGetImageTagManifestResponse(resp: unknown): resp is GetImageTagManifestResponse {
  return (
    typeof resp === 'object' &&
    !Array.isArray(resp) &&
    resp !== null &&
    hasKeysOfType<GetImageTagManifestResponse>(resp, {
      schemaVersion: 'number',
      mediaType: 'string',
      config: 'object',
      layers: 'object',
    }) &&
    hasKeysOfType<GetImageTagManifestResponse['config']>(resp['config'], {
      mediaType: 'string',
      size: 'number',
      digest: 'string',
    }) &&
    Array.isArray(resp['layers']) &&
    resp['layers'].every((layer) =>
      hasKeysOfType<GetImageTagManifestResponse['layers'][number]>(layer, {
        mediaType: 'string',
        size: 'number',
        digest: 'string',
      }),
    )
  )
}

type GetRegistryLayerStreamResponse = {
  ok: boolean
  body: Readable | ReadableStream
}
export async function getRegistryLayerStream(token: string, imageRef: RepoRef, layerDigest: string) {
  const responseStream = (
    await registryRequest(
      token,
      `${imageRef.namespace}/${imageRef.image}/blobs/${layerDigest}`,
      true,
      {},
      { Accept: 'application/vnd.docker.distribution.manifest.v2+json' },
    )
  ).res

  if (!isGetRegistryLayerStream(responseStream)) {
    throw InternalError('Unrecognised response stream when getting image layer blob.', {
      responseStream,
      namespace: imageRef.namespace,
      image: imageRef.image,
      layerDigest,
    })
  }

  return responseStream
}

function isGetRegistryLayerStream(resp: unknown): resp is GetRegistryLayerStreamResponse {
  return (
    typeof resp === 'object' &&
    !Array.isArray(resp) &&
    resp !== null &&
    hasKeysOfType<GetRegistryLayerStreamResponse>(resp, {
      ok: 'boolean',
      body: 'object',
    }) &&
    resp['body'] !== null &&
    (resp['body'] instanceof Readable ||
      resp['body'] instanceof ReadableStream ||
      hasKeysOfType(resp['body'], { pipe: 'function', read: 'function', _read: 'function' }))
  )
}

type DoesLayerExistResponse = {
  'accept-ranges': string
  'content-length': string
  'content-type': string
  date: string
  'docker-content-digest': string
  'docker-distribution-api-version': string
  etag: string
}
export async function doesLayerExist(token: string, imageRef: RepoRef, digest: string) {
  try {
    const responseHeaders = (
      await registryRequest(token, `${imageRef.namespace}/${imageRef.image}/blobs/${digest}`, true, {
        method: 'HEAD',
      })
    ).headers
    const headersObject = Object.fromEntries(responseHeaders)

    if (!isDoesLayerExistResponse(headersObject)) {
      throw InternalError('Unrecognised response headers when heading image layer.', {
        responseHeaders: responseHeaders,
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

function isDoesLayerExistResponse(resp: unknown): resp is DoesLayerExistResponse {
  return hasKeysOfType<DoesLayerExistResponse>(resp, {
    'accept-ranges': 'string',
    'content-length': 'string',
    'content-type': 'string',
    date: 'string',
    'docker-content-digest': 'string',
    'docker-distribution-api-version': 'string',
    etag: 'string',
  })
}

type InitialiseUploadResponse = {
  'content-length': string
  date: string
  'docker-distribution-api-version': string
  'docker-upload-uuid': string
  location: string
  range: string
}
export async function initialiseUpload(token: string, imageRef: RepoRef) {
  const responseHeaders = (
    await registryRequest(token, `${imageRef.namespace}/${imageRef.image}/blobs/uploads/`, true, {
      method: 'POST',
    })
  ).headers
  const headersObject = Object.fromEntries(responseHeaders)

  if (!isInitialiseUploadObjectResponse(headersObject)) {
    throw InternalError('Unrecognised response headers when posting initialise image upload.', {
      responseHeaders: responseHeaders,
      headersObject,
      namespace: imageRef.namespace,
      image: imageRef.image,
    })
  }

  return headersObject
}

function isInitialiseUploadObjectResponse(resp: unknown): resp is InitialiseUploadResponse {
  return hasKeysOfType<InitialiseUploadResponse>(resp, {
    'content-length': 'string',
    date: 'string',
    'docker-distribution-api-version': 'string',
    'docker-upload-uuid': 'string',
    location: 'string',
    range: 'string',
  })
}

type PutManifestResponse = {
  'content-length': string
  date: string
  'docker-content-digest': string
  'docker-distribution-api-version': string
  location: string
}
export async function putManifest(
  token: string,
  imageRef: RepoRef,
  imageTag: string,
  manifest: any,
  contentType: string,
) {
  const responseHeaders = (
    await registryRequest(
      token,
      `${imageRef.namespace}/${imageRef.image}/manifests/${imageTag}`,
      true,
      {
        method: 'PUT',
        body: manifest,
      },
      { 'Content-Type': contentType, name: `${imageRef.namespace}/${imageRef.image}`, reference: imageTag },
    )
  ).headers
  const headersObject = Object.fromEntries(responseHeaders)

  if (!isPutManifestResponse(headersObject)) {
    throw InternalError('Unrecognised response headers when putting image manifest.', {
      responseHeaders: responseHeaders,
      namespace: imageRef.namespace,
      image: imageRef.image,
    })
  }

  return headersObject
}

function isPutManifestResponse(resp: unknown): resp is PutManifestResponse {
  return hasKeysOfType<PutManifestResponse>(resp, {
    'content-length': 'string',
    date: 'string',
    'docker-content-digest': 'string',
    'docker-distribution-api-version': 'string',
    location: 'string',
  })
}

type UploadLayerMonolithicResponse = PutManifestResponse
export async function uploadLayerMonolithic(
  token: string,
  uploadURL: string,
  digest: string,
  blob: Stream,
  size: string,
) {
  log.debug('uploadLayerMonolithic', { token, uploadURL, digest, blob, size })
  const responseHeaders = (
    await registryRequest(
      token,
      `${uploadURL}&digest=${digest}`.replace(/^(\/v2\/)/, ''),
      true,
      {
        method: 'PUT',
        body: blob,
        duplex: 'half',
      },
      {
        'content-length': size,
        'content-type': 'application/octet-stream',
      },
    )
  ).headers
  const headersObject = Object.fromEntries(responseHeaders)

  if (!isUploadLayerMonolithicResponse(headersObject)) {
    throw InternalError('Unrecognised response headers when putting image manifest.', {
      responseHeaders: responseHeaders,
      uploadURL,
      digest,
      size,
    })
  }

  return headersObject
}

function isUploadLayerMonolithicResponse(resp: unknown): resp is UploadLayerMonolithicResponse {
  return isPutManifestResponse(resp)
}
