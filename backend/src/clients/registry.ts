import fetch from 'node-fetch'

import { getHttpsAgent } from '../services/v2/http.js'
import config from '../utils/v2/config.js'
import { InternalError } from '../utils/v2/error.js'

interface RepoRef {
  namespace: string
  image: string
}

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

  if (!res.ok) {
    throw InternalError('Non-200 response returned by the registry.', {
      status: res.status,
      statusText: res.statusText,
      body: await res.text(),
    })
  }

  return await res.json()
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

  const responseBody = await registryRequest(token, `${repo}/tags/list`)
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
