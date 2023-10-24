import useSWR from 'swr'

import { ReleaseInterface } from '../types/types'
import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetReleasesForModelId(id?: string) {
  const { data, error, mutate } = useSWR<
    {
      releases: ReleaseInterface[]
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/releases` : null, fetcher)

  return {
    mutateReleases: mutate,
    releases: data ? data.releases : [],
    isReleasesLoading: !error && !data,
    isReleasesError: error,
  }
}

export async function postRelease(release: Partial<ReleaseInterface>, modelId: string) {
  return fetch(`/api/v2/model/${modelId}/releases`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(release),
  })
}

export async function postFile(artefact: File, modelId: string, name: string, mime: string) {
  return fetch(`/api/v2/model/${modelId}/files/uploadss/simple?name=${name}&mine=${mime}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: artefact,
  })
}
