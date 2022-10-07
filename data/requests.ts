import qs from 'qs'
import useSWR from 'swr'
import { Request } from '../types/interfaces'
import { fetcher } from '../utils/fetcher'

export type RequestType = 'Upload' | 'Deployment'
export type ReviewFilterType = 'user' | 'archived'
export function useListRequests(type: RequestType, filter: ReviewFilterType) {
  const { data, error, mutate } = useSWR<{
    requests: Array<Request>
  }>(
    `/api/v1/requests?${qs.stringify({
      type,
      filter,
    })}`,
    fetcher
  )

  return {
    mutateRequests: mutate,
    requests: data?.requests,
    isRequestsLoading: !error && !data,
    isRequestsError: error,
  }
}

export function useGetNumRequests() {
  const { data, error, mutate } = useSWR<{
    count: number
  }>(`/api/v1/requests/count`, fetcher)

  return {
    mutateNumRequests: mutate,
    numRequests: data?.count,
    isNumRequestsLoading: !error && !data,
    isNumRequestsError: error,
  }
}
