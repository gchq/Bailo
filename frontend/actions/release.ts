import axios from 'axios'
import useSWR from 'swr'
import { ReleaseInterface } from 'types/types'

import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useGetReleasesForModelId(id?: string) {
  const { data, error, mutate } = useSWR<
    {
      data: { releases: ReleaseInterface[] }
    },
    ErrorInfo
  >(id ? `/api/v2/model/${id}/releases` : null, fetcher)

  return {
    mutateReleases: mutate,
    releases: data ? data.data.releases : [],
    isReleasesLoading: !error && !data,
    isReleasesError: error,
  }
}

export async function postRelease(release: Partial<ReleaseInterface>, modelId: string) {
  return await axios({
    method: 'post',
    url: `/api/v2/model/${modelId}/releases`,
    headers: { 'Content-Type': 'application/json' },
    data: release,
  })
    .then((res) => {
      return res.status < 400 ? { status: res.status, data: res.data.data } : { status: res.status, error: res.data }
    })
    .catch((e) => {
      return { data: undefined, error: e }
    })
}
