import useSWR from 'swr'
import { AccessRequestInterface } from 'types/interfaces'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetAccessRequestsForModelId(modelId?: string) {
  const { data, error, mutate } = useSWR<
    {
      accessRequests: AccessRequestInterface[]
    },
    ErrorInfo
  >(modelId ? `/api/v2/model/${modelId}/access-requests` : null, fetcher)

  return {
    mutateAccessRequests: mutate,
    accessRequests: data ? data.accessRequests : [],
    isAccessRequestsLoading: !error && !data,
    isAccessRequestsError: error,
  }
}
