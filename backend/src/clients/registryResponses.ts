import { arrayOfObjectsHasKeysOfType, hasKeys, hasKeysOfType } from '../utils/typeguards.js'

export type RegistryErrorResponse = {
  errors: Array<ErrorInfo>
}

export type ErrorInfo = { code: string; message: string; detail: string }

type ListImageTagResponse = { tags: Array<string> }

type ListModelReposResponse = { repositories: Array<string> }

type GetImageTagManifestResponse = {
  schemaVersion: number
  mediaType: string
  config: { mediaType: string; size: number; digest: string }
  layers: { mediaType: string; size: number; digest: string }[]
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

type PutManifestResponse = {
  'content-length': string
  date: string
  'docker-content-digest': string
  'docker-distribution-api-version': string
  location: string
}

type UploadLayerMonolithicResponse = PutManifestResponse

type InitialiseUploadResponse = {
  'content-length': string
  date: string
  'docker-distribution-api-version': string
  'docker-upload-uuid': string
  location: string
  range: string
}

type DeleteImageResponse = {
  'content-length': string
}

export function isRegistryErrorResponse(resp: unknown): resp is RegistryErrorResponse {
  return (
    hasKeys(resp, ['errors']) &&
    arrayOfObjectsHasKeysOfType(resp['errors'], {
      code: 'string',
      message: 'string',
      detail: 'object',
    }) &&
    resp['errors'].every((e) => Array.isArray(e['detail']))
  )
}

export function isListImageTagResponse(resp: unknown): resp is ListImageTagResponse {
  return (
    hasKeysOfType(resp, { tags: 'object' }) &&
    Array.isArray(resp['tags']) &&
    resp['tags'].every((repo: unknown) => typeof repo === 'string')
  )
}

export function isListModelReposResponse(resp: unknown): resp is ListModelReposResponse {
  return (
    hasKeysOfType(resp, { repositories: 'object' }) &&
    Array.isArray(resp['repositories']) &&
    resp['repositories'].every((repo: unknown) => typeof repo === 'string')
  )
}

export function isGetImageTagManifestResponse(resp: unknown): resp is GetImageTagManifestResponse {
  return (
    hasKeysOfType(resp, {
      schemaVersion: 'number',
      mediaType: 'string',
      config: 'object',
      layers: 'object',
    }) &&
    hasKeysOfType(resp['config'], {
      mediaType: 'string',
      size: 'number',
      digest: 'string',
    }) &&
    arrayOfObjectsHasKeysOfType(resp['layers'], {
      mediaType: 'string',
      size: 'number',
      digest: 'string',
    })
  )
}

export function isDoesLayerExistResponse(resp: unknown): resp is DoesLayerExistResponse {
  return hasKeysOfType(resp, {
    'accept-ranges': 'string',
    'content-length': 'string',
    'content-type': 'string',
    date: 'string',
    'docker-content-digest': 'string',
    'docker-distribution-api-version': 'string',
    etag: 'string',
  })
}

export function isPutManifestResponse(resp: unknown): resp is PutManifestResponse {
  return hasKeysOfType(resp, {
    'content-length': 'string',
    date: 'string',
    'docker-content-digest': 'string',
    'docker-distribution-api-version': 'string',
    location: 'string',
  })
}

export function isUploadLayerMonolithicResponse(resp: unknown): resp is UploadLayerMonolithicResponse {
  return isPutManifestResponse(resp)
}

export function isInitialiseUploadObjectResponse(resp: unknown): resp is InitialiseUploadResponse {
  return hasKeysOfType(resp, {
    'content-length': 'string',
    date: 'string',
    'docker-distribution-api-version': 'string',
    'docker-upload-uuid': 'string',
    location: 'string',
    range: 'string',
  })
}

export function isDeleteImageResponse(resp: unknown): resp is DeleteImageResponse {
  return hasKeysOfType(resp, {
    'content-length': 'string',
    date: 'string',
    'docker-distribution-api-version': 'string',
    'docker-upload-uuid': 'string',
    location: 'string',
    range: 'string',
  })
}
