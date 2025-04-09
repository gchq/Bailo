import qs from 'querystring'
import { UserInformation } from 'src/common/UserDisplay'
import useSWR from 'swr'
import { EntityObject, EntryInterface, TokenAction, TokenInterface, TokenScopeKeys, User } from 'types/types'

import { ErrorInfo, fetcher } from '../utils/fetcher'

const emptyEntityList = []

export function useListUsers(q: string) {
  const { data, isLoading, error, mutate } = useSWR<
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
    users: data ? data.results : emptyEntityList,
    isUsersLoading: isLoading,
    isUsersError: error,
  }
}

interface UserResponse {
  user: User
}

export function useGetCurrentUser() {
  const { data, isLoading, error, mutate } = useSWR<UserResponse, ErrorInfo>('/api/v2/entities/me', fetcher)

  return {
    mutateCurrentUser: mutate,
    currentUser: data?.user || undefined,
    isCurrentUserLoading: isLoading,
    isCurrentUserError: error,
  }
}

interface UserInformationResponse {
  entity: UserInformation
}

export function useGetUserInformation(dn: string) {
  const { data, isLoading, error, mutate } = useSWR<UserInformationResponse, ErrorInfo>(
    `/api/v2/entity/${dn}/lookup`,
    fetcher,
    {
      onErrorRetry: (error) => {
        if (error.status === 404) return
      },
    },
  )

  return {
    mutateUserInformation: mutate,
    userInformation: data?.entity || undefined,
    isUserInformationLoading: isLoading,
    isUserInformationError: error,
  }
}

export function getUserInformation(dn: string) {
  return fetch(`/api/v2/entity/${dn}/lookup`, { method: 'get' })
}

interface GetUserTokensResponse {
  tokens: TokenInterface[]
}

const emptyTokenList = []

export function useGetUserTokens() {
  const { data, isLoading, error, mutate } = useSWR<GetUserTokensResponse, ErrorInfo>('/api/v2/user/tokens', fetcher)

  return {
    mutateTokens: mutate,
    tokens: data?.tokens || emptyTokenList,
    isTokensLoading: isLoading,
    isTokensError: error,
  }
}

export function postUserToken(
  description: string,
  scope: TokenScopeKeys,
  modelIds: EntryInterface['id'][],
  actions: string[],
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

export interface GetUserTokenListResponse {
  tokenActionMap: TokenAction[]
}

const emptyTokenActionList = []

export function useGetUserTokenList() {
  const { data, isLoading, error, mutate } = useSWR<GetUserTokenListResponse, ErrorInfo>(
    '/api/v2/user/tokens/list',
    fetcher,
  )

  return {
    mutateTokenActions: mutate,
    tokenActions: data?.tokenActionMap || emptyTokenActionList,
    isTokenActionsLoading: isLoading,
    isTokenActionsError: error,
  }
}
