import { BodyInit, HeadersInit, RequestInit } from 'undici-types'

import { getHttpsUndiciAgent } from '../services/http.js'
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
  isStreamResponse,
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

async function registryRequest(
  token: string,
  endpoint: string,
  returnRawBody: boolean = false,
  extraFetchOptions: Partial<Omit<RequestInit, 'headers' | 'dispatcher'>> = {},
  extraHeaders: HeadersInit = {},
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
  let body: unknown
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
    if (body === undefined && returnRawBody && res.body !== null) {
      // try to get the json if there's an error, even if we wanted the raw body
      try {
        body = await res.json()
      } catch {
        // the response may not have a json body
      }
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

  const headersObject = headers ? Object.fromEntries(headers) : {}

  if (returnRawBody) {
    return { res, headers: headersObject }
  } else {
    return { body, headers: headersObject }
  }
}

// Currently limited to a maximum 100 image names
export async function listModelRepos(token: string, modelId: string) {
  const { body } = await registryRequest(token, `_catalog?n=100&last=${modelId}`)
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
    ;({ body } = await registryRequest(token, `${repo}/tags/list`))
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

export async function getRegistryLayerStream(token: string, imageRef: RepoRef, layerDigest: string) {
  const responseStream = (
    await registryRequest(token, `${imageRef.namespace}/${imageRef.image}/blobs/${layerDigest}`, true, undefined, {
      Accept: 'application/vnd.docker.distribution.manifest.v2+json',
    })
  ).res

  if (!isStreamResponse(responseStream)) {
    throw InternalError('Unrecognised response stream when getting image layer blob.', {
      responseStream,
      namespace: imageRef.namespace,
      image: imageRef.image,
      layerDigest,
    })
  }

  return responseStream
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
  blob: BodyInit,
  size: string,
) {
  const { headers } = await registryRequest(
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

  if (!isUploadLayerMonolithicResponse(headers)) {
    throw InternalError('Unrecognised response headers when putting image manifest.', {
      headers,
      uploadURL,
      digest,
      size,
    })
  }

  return headers
}
