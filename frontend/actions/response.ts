import qs from 'querystring'
import useSWR from 'swr'
import { ResponseInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export function useGetResponses(parentIds: string[]) {
  const queryParams = {
    ...(parentIds.length > 0 && { parentIds }),
  }

  const { data, error, mutate, isLoading } = useSWR<
    {
      responses: ResponseInterface[]
    },
    ErrorInfo
  >(Object.entries(queryParams).length > 0 ? `/api/v2/response?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateResponses: mutate,
    responses: data ? data.responses : Array<ResponseInterface>,
    isResponsesLoading: isLoading && !error,
    isResponsesError: error,
  }
}
