import qs from 'querystring'
import useSWR from 'swr'
import { ReactionKindKeys, ResponseInterface } from 'types/types'
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
  >(Object.entries(queryParams).length > 0 ? `/api/v2/responses?${qs.stringify(queryParams)}` : null, fetcher)

  return {
    mutateResponses: mutate,
    responses: data ? data.responses : [],
    isResponsesLoading: !error && !data,
    isResponsesError: error,
  }
}

export async function patchResponseReaction(id: string, kind: ReactionKindKeys) {
  return fetch(`/api/v2/response/${id}/reaction/${kind}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  })
}
