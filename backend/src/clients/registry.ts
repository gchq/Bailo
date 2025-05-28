import { Stream } from 'node:stream'

import { getHttpsUndiciAgent } from '../services/http.js'
import log from '../services/log.js'
import { isRegistryError } from '../types/RegistryError.js'
import config from '../utils/config.js'
import { InternalError, RegistryError } from '../utils/error.js'

interface RepoRef {
  namespace: string
  image: string
}

export type RegistryErrorResponse = {
  errors: Array<ErrorInfo>
}

export type ErrorInfo = { code: string; message: string; details: Array<unknown> }

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
  if (typeof resp !== 'object' || resp === null) {
    return false
  }
  if (!('repositories' in resp) || !Array.isArray(resp.repositories)) {
    return false
  }
  return true
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
  if (typeof resp !== 'object' || resp === null) {
    return false
  }
  if (!('tags' in resp) || !Array.isArray(resp.tags)) {
    return false
  }
  return true
}

function isRegistryErrorResponse(resp: unknown): resp is RegistryErrorResponse {
  if (typeof resp !== 'object' || resp === null) {
    return false
  }
  if (!('errors' in resp) || !Array.isArray(resp.errors)) {
    return false
  }
  if (!resp.errors.every((item) => 'code' in item && 'message' in item && 'detail' in item)) {
    return false
  }
  return true
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
  if (typeof resp !== 'object' || Array.isArray(resp) || resp === null) {
    return false
  }
  if (!('schemaVersion' in resp) || !Number.isInteger(resp.schemaVersion)) {
    return false
  }
  if (!('mediaType' in resp) || !(typeof resp.mediaType === 'string')) {
    return false
  }
  if (!('config' in resp) || typeof resp.config !== 'object' || Array.isArray(resp.config) || resp.config === null) {
    return false
  }
  if (!('mediaType' in resp.config) || !(typeof resp.config.mediaType === 'string')) {
    return false
  }
  if (!('size' in resp.config) || !Number.isInteger(resp.config.size)) {
    return false
  }
  if (!('digest' in resp.config) || !(typeof resp.config.digest === 'string')) {
    return false
  }
  if (!('layers' in resp) || !Array.isArray(resp.layers)) {
    return false
  }
  for (const layer of resp.layers) {
    if (typeof layer !== 'object' || Array.isArray(layer) || layer === null) {
      return false
    }
    if (!('mediaType' in layer) || !(typeof layer['mediaType'] === 'string')) {
      return false
    }
    if (!('size' in layer) || !Number.isInteger(layer['size'])) {
      return false
    }
    if (!('digest' in layer) || !(typeof layer['digest'] === 'string')) {
      return false
    }
  }
  return true
}

type GetRegistryLayerStreamResponse = {
  ok: boolean
  body: ReadableStream
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
  if (typeof resp !== 'object' || Array.isArray(resp) || resp === null) {
    return false
  }
  if (!('ok' in resp) || typeof resp.ok !== 'boolean') {
    return false
  }
  if (!('body' in resp) || typeof resp.body !== 'object' || Array.isArray(resp.body) || resp.body === null) {
    return false
  }
  for (const objectKey of ['cancel', 'getReader', 'pipeThrough', 'pipeTo', 'tee', 'values']) {
    if (
      !(objectKey in resp.body) ||
      typeof resp.body[objectKey] !== 'function' ||
      Array.isArray(resp.body[objectKey]) ||
      resp.body[objectKey] === null
    ) {
      return false
    }
  }
  return true
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
  if (typeof resp !== 'object' || Array.isArray(resp) || resp === null) {
    return false
  }
  // type guard expected header keys
  if (!('accept-ranges' in resp) || !(typeof resp['accept-ranges'] === 'string')) {
    return false
  }
  if (!('content-length' in resp) || !(typeof resp['content-length'] === 'string')) {
    return false
  }
  if (!('content-type' in resp) || !(typeof resp['content-type'] === 'string')) {
    return false
  }
  if (!('date' in resp) || !(typeof resp['date'] === 'string')) {
    return false
  }
  if (!('docker-content-digest' in resp) || !(typeof resp['docker-content-digest'] === 'string')) {
    return false
  }
  if (!('docker-distribution-api-version' in resp) || !(typeof resp['docker-distribution-api-version'] === 'string')) {
    return false
  }
  if (!('etag' in resp) || !(typeof resp['etag'] === 'string')) {
    return false
  }
  return true
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
  if (typeof resp !== 'object' || Array.isArray(resp) || resp === null) {
    return false
  }
  // type guard expected header keys
  if (!('content-length' in resp) || !(typeof resp['content-length'] === 'string')) {
    return false
  }
  if (!('date' in resp) || !(typeof resp['date'] === 'string')) {
    return false
  }
  if (!('docker-distribution-api-version' in resp) || !(typeof resp['docker-distribution-api-version'] === 'string')) {
    return false
  }
  if (!('docker-upload-uuid' in resp) || !(typeof resp['docker-upload-uuid'] === 'string')) {
    return false
  }
  if (!('location' in resp) || !(typeof resp['location'] === 'string')) {
    return false
  }
  if (!('range' in resp) || !(typeof resp['range'] === 'string')) {
    return false
  }
  return true
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

function isPutManifestResponse(resp: unknown): resp is UploadLayerMonolithicResponse {
  if (typeof resp !== 'object' || Array.isArray(resp) || resp === null) {
    return false
  }
  // type guard expected header keys
  if (!('content-length' in resp) || !(typeof resp['content-length'] === 'string')) {
    return false
  }
  if (!('date' in resp) || !(typeof resp['date'] === 'string')) {
    return false
  }
  if (!('docker-content-digest' in resp) || !(typeof resp['docker-content-digest'] === 'string')) {
    return false
  }
  if (!('docker-distribution-api-version' in resp) || !(typeof resp['docker-distribution-api-version'] === 'string')) {
    return false
  }
  if (!('location' in resp) || !(typeof resp['location'] === 'string')) {
    return false
  }
  return true
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
