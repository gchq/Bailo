import qs from 'querystring'
import { UserInformation } from 'src/common/UserDisplay'
import useSWR from 'swr'
import { EntityObject, EntryInterface, TokenActionKeys, TokenInterface, TokenScopeKeys, User } from 'types/types'

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
  const { data, error, mutate } = useSWR<UserResponse, ErrorInfo>('/api/v2/entities/me', fetcher)

  return {
    mutateCurrentUser: mutate,
    currentUser: data?.user || undefined,
    isCurrentUserLoading: !error && !data,
    isCurrentUserError: error,
  }
}

interface UserInformationResponse {
  entity: UserInformation
}

export function useGetUserInformation(dn: string) {
  const { data, error, mutate } = useSWR<UserInformationResponse, ErrorInfo>(`/api/v2/entity/${dn}/lookup`, fetcher)

  return {
    mutateUserInformation: mutate,
    userInformation: data?.entity || undefined,
    isUserInformationLoading: !error && !data,
    isUserInformationError: error,
  }
}

interface GetUserTokensResponse {
  tokens: TokenInterface[]
}

export function useGetUserTokens() {
  const { data, error, mutate } = useSWR<GetUserTokensResponse, ErrorInfo>('/api/v2/user/tokens', fetcher)

  return {
    mutateTokens: mutate,
    tokens: data?.tokens || [],
    isTokensLoading: !error && !data,
    isTokensError: error,
  }
}

export function postUserToken(
  description: string,
  scope: TokenScopeKeys,
  modelIds: EntryInterface['id'][],
  actions: TokenActionKeys[],
) {
  return fetch('/api/v2/user/tokens', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, scope, modelIds, actions }),
  })
}

export function deleteUserToken(accessKey: TokenInterface['accessKey']) {
  return fetch(`/api/v2/user/token/${accessKey}`, {
    method: 'delete',
  })
}
