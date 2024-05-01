import axios, { AxiosProgressEvent } from 'axios'
import qs from 'querystring'
import useSWR from 'swr'
import { ReleaseInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetReleasesForModelId(modelId?: string) {
  const { data, error, mutate } = useSWR<
    {
      releases: ReleaseInterface[]
    },
    ErrorInfo
  >(modelId ? `/api/v2/model/${modelId}/releases` : null, fetcher)

  return {
    mutateReleases: mutate,
    releases: data ? data.releases : [],
    isReleasesLoading: !error && !data,
    isReleasesError: error,
  }
}

export function useGetRelease(modelId?: string, semver?: string) {
  const { data, error, mutate } = useSWR<{ release: ReleaseInterface }, ErrorInfo>(
    modelId && semver ? `/api/v2/model/${modelId}/release/${semver}` : null,
    fetcher,
  )

  return {
    mutateRelease: mutate,
    release: data ? data.release : undefined,
    isReleaseLoading: !error && !data,
    isReleaseError: error,
  }
}

export type CreateReleaseParams = Pick<
  ReleaseInterface,
  'modelId' | 'modelCardVersion' | 'semver' | 'notes' | 'minor' | 'draft' | 'fileIds' | 'images'
>

export async function postRelease(release: CreateReleaseParams) {
  return fetch(`/api/v2/model/${release.modelId}/releases`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(release),
  })
}

export type UpdateReleaseParams = Pick<
  ReleaseInterface,
  'modelId' | 'modelCardVersion' | 'semver' | 'notes' | 'minor' | 'draft' | 'fileIds' | 'images' | 'comments'
>

export function putRelease(release: UpdateReleaseParams) {
  return fetch(`/api/v2/model/${release.modelId}/release/${release.semver}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(release),
  })
}

export function postReleaseComment(modelId: string, semver: string, comment: string) {
  return fetch(`/api/v2/model/${modelId}/release/${semver}/comment`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  })
}

export function deleteRelease(modelId: string, semver: string) {
  return fetch(`/api/v2/model/${modelId}/release/${semver}`, {
    method: 'delete',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function postSimpleFileForRelease(
  modelId: string,
  file: File,
  onUploadProgress: (progress: AxiosProgressEvent) => void,
  metadata?: string,
) {
  const mime = file.type || 'application/octet-stream'
  const fileResponse = await axios
    .post(
      metadata
        ? `/api/v2/model/${modelId}/files/upload/simple?name=${file.name}&mime=${mime}?${qs.stringify({
            metadata,
          })}`
        : `/api/v2/model/${modelId}/files/upload/simple?name=${file.name}&mime=${mime}`,
      file,
      {
        onUploadProgress,
      },
    )
    .catch(function (error) {
      if (error.response) {
        throw new Error(
          `Error code ${error.response.status} received from server whilst attempting to upload file ${file.name}`,
        )
      } else if (error.request) {
        throw new Error(`There was a problem with the request whilst attempting to upload file ${file.name}`)
      } else {
        throw new Error(`Unknown error whilst attempting to upload file ${file.name}`)
      }
    })
  return fileResponse
}
