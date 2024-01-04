import qs from 'querystring'
import useSWR from 'swr'
import { EntityObject, ModelInterface, TokenActionsKeys, TokenScopeKeys, User } from 'types/v2/types'

import { ErrorInfo, fetcher } from '../utils/fetcher'

export function useListUsers(q: string) {
  const { data, error, mutate } = useSWR<
    {
      results: EntityObject[]
    },
    ErrorInfo
  >(
    q.length >= 3
      ? `/api/v2/entities?${qs.stringify({
          q,
        })}`
      : null,
    fetcher,
  )

  return {
    mutateUsers: mutate,
    users: data ? data.results : [],
    isUsersLoading: !error && !data,
    isUsersError: error,
  }
}

interface UserResponse {
  user: User
}

export function useGetCurrentUser() {
  const { data, error, mutate } = useSWR<UserResponse, ErrorInfo>(`/api/v2/entities/me`, fetcher)

  return {
    mutateCurrentUser: mutate,
    currentUser: data?.user || undefined,
    isCurrentUserLoading: !error && !data,
    isCurrentUserError: error,
  }
}

export function postUserToken(
  description: string,
  scope: TokenScopeKeys,
  modelIds: ModelInterface['id'][],
  actions: TokenActionsKeys[],
) {
  return fetch('/api/v2/user/tokens', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, scope, modelIds, actions }),
  })
}
