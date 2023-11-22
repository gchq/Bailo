import qs from 'querystring'
import useSWR from 'swr'
import { EntityObject } from 'types/v2/types'

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
  user: {
    dn: string
  }
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

function formatDisplayName(dn: string) {
  return dn.includes(':') ? dn.split(':')[1] : dn
}

function formatArrayDisplayNameFromEntityObject(entityList: EntityObject[]) {
  return entityList.map((entity) => ({ id: formatDisplayName(entity.id), kind: entity.kind }))
}

export function useGetIdentity(dn: string) {
  return {
    mutateEntity: () => undefined,
    entity: formatDisplayName(dn),
    isEntityLoading: false,
    isEntityError: undefined as ErrorInfo | undefined,
  }
}

export function useGetIdentitiesFromEntityObjects(dnList: EntityObject[]) {
  return {
    mutateEntities: () => undefined,
    entities: formatArrayDisplayNameFromEntityObject(dnList),
    isEntitiesLoading: false,
    isEntitiesError: undefined as ErrorInfo | undefined,
  }
}
