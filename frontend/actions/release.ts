import axios from 'axios'
import useSWR from 'swr'

import { ReleaseInterface } from '../types/types'
import { handleAxiosError } from '../utils/axios'
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
  try {
    const response = await axios({
      method: 'post',
      url: `/api/v2/model/${modelId}/releases`,
      headers: { 'Content-Type': 'application/json' },
      data: release,
    })
    return { status: response.status, data: response.data }
  } catch (error) {
    return handleAxiosError(error)
  }
}
