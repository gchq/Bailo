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

export async function postFile(file: File, modelId: string, name: string, mime: string, metadata?: string | undefined) {
  const mimeParam = mime || 'application/octet-stream'

  return fetch(
    metadata
      ? `/api/v2/model/${modelId}/files/upload/simple?name=${name}&mime=${mimeParam}?${qs.stringify({
          metadata,
        })}`
      : `/api/v2/model/${modelId}/files/upload/simple?name=${name}&mime=${mimeParam}`,
    {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: file,
    },
  )
}
