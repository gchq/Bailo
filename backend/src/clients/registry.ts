import fetch, { Response } from 'node-fetch'

import { getHttpsAgent } from '../services/http.js'
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

export type ErrorInfo = { code: string; message: string; detail: string }

const registry = config.registry.connection.internal

const agent = getHttpsAgent({
  rejectUnauthorized: !config.registry.connection.insecure,
})

async function registryRequest(token: string, endpoint: string, returnStream: boolean = false) {
  let res: Response
  try {
    res = await fetch(`${registry}/v2/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      agent,
    })
  } catch (err) {
    throw InternalError('Unable to communicate with the registry.', { err })
  }
  let body
  // don't get the json if the response is a stream and is ok
  if (!returnStream || !res.ok) {
    body = await res.json()
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

  if (returnStream) {
    return res
  } else {
    return body
  }
}

// Currently limited to a maximum 100 image names
type ListModelReposResponse = { repositories: Array<string> }
export async function listModelRepos(token: string, modelId: string) {
  const responseBody = await registryRequest(token, `_catalog?n=100&last=${modelId}`)
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
    responseBody = await registryRequest(token, `${repo}/tags/list`)
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

export async function getImageDigest(token: string, repository: string, tag: string) {
  const responseBody = await registryRequest(token, `${repository}/manifests/${tag}`)
  return responseBody
}

export function isRegistryErrorResponse(resp: unknown): resp is RegistryErrorResponse {
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
  const responseBody = await registryRequest(token, `${imageRef.namespace}/${imageRef.image}/manifests/${imageTag}`)
  if (!isGetImageTagManifestResponse(responseBody)) {
    throw InternalError('Unrecognised response body when getting image tag manifest.', {
      responseBody,
      namespace: imageRef.namespace,
      image: imageRef.image,
      imageTag,
    })
  }
  return responseBody
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
  body: {
    on: any
    _events: object
    _readableState: object
    _writableState: object
    allowHalfOpen: boolean
    _maxListeners: unknown
    _eventsCount: number
  }
}
export async function getRegistryLayerStream(token: string, imageRef: RepoRef, layerDigest: string) {
  const responseBody = await registryRequest(
    token,
    `${imageRef.namespace}/${imageRef.image}/blobs/${layerDigest}`,
    true,
  )

  if (!isGetRegistryLayerStream(responseBody)) {
    throw InternalError('Unrecognised response body when getting image layer blob.', {
      responseBody,
      namespace: imageRef.namespace,
      image: imageRef.image,
      layerDigest,
    })
  }

  return responseBody
}

function isGetRegistryLayerStream(resp: unknown): resp is GetRegistryLayerStreamResponse {
  if (typeof resp !== 'object' || Array.isArray(resp) || resp === null) {
    return false
  }
  if (!('body' in resp) || typeof resp.body !== 'object' || Array.isArray(resp.body) || resp.body === null) {
    return false
  }
  for (const objectKey of ['_events', '_readableState', '_writableState']) {
    if (
      !(objectKey in resp.body) ||
      typeof resp.body[objectKey] !== 'object' ||
      Array.isArray(resp.body[objectKey]) ||
      resp.body[objectKey] === null
    ) {
      return false
    }
  }
  if (!('allowHalfOpen' in resp.body) || typeof resp.body.allowHalfOpen !== 'boolean') {
    return false
  }
  if (!('_maxListeners' in resp.body)) {
    return false
  }
  if (!('_eventsCount' in resp.body) || !Number.isInteger(resp.body._eventsCount)) {
    return false
  }
  return true
}
