import qs from 'querystring'
import useSWR from 'swr'
import { ResponseInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetResponses(parentIds: string[]) {
  const queryParams = {
    ...(parentIds.length > 0 && { parentIds }),
  }

  const { data, error, mutate } = useSWR<
    {
      responses: ResponseInterface[]
    },
    ErrorInfo
  >(queryParams ? `/api/v2/response?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateResponses: mutate,
    responses: data ? data.responses : [],
    isResponsesLoading: !error && !data,
    isResponsesError: error,
  }
}
