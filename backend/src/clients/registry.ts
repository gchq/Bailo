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

export type ErrorInfo = { code: string; message: string; details: Array<unknown> }

const registry = config.registry.connection.internal

const agent = getHttpsAgent({
  rejectUnauthorized: !config.registry.connection.insecure,
})

async function registryRequest(token: string, endpoint: string) {
  let res
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
  const body = await res.json()
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

  return body
}

async function registryRequestStream(token: string, endpoint: string) {
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

  if (!res.ok || res.body === null) {
    const context = {
      url: res.url,
      status: res.status,
      statusText: res.statusText,
    }
    throw InternalError('Unrecognised response returned by the registry.', {
      ...context,
    })
  }

  return res
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

export async function getImageTagManifest(token: string, imageRef: RepoRef, imageTag: string) {
  const responseBody = await registryRequest(token, `${imageRef.namespace}/${imageRef.image}/manifests/${imageTag}`)
  if (responseBody === null) {
    throw InternalError('Unrecognised response body when getting image tag manifest.', {
      responseBody,
      namespace: imageRef.namespace,
      image: imageRef.image,
      imageTag,
    })
  }
  return responseBody
}

export async function getRegistryLayerStream(token: string, imageRef: RepoRef, layerDigest: string) {
  const responseBody = await registryRequestStream(
    token,
    `${imageRef.namespace}/${imageRef.image}/blobs/${layerDigest}`,
  )

  if (responseBody === null || !responseBody.ok || responseBody.body === null) {
    throw InternalError('Unrecognised response body when getting image layer blob.', {
      responseBody,
      namespace: imageRef.namespace,
      image: imageRef.image,
      layerDigest,
    })
  }

  return responseBody
}
