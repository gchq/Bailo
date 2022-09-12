import useSWR from 'swr'
import { User } from '../types/interfaces'
import { fetcher } from '../utils/fetcher'

export function useListUsers() {
  const { data, error, mutate } = useSWR<{
    users: Array<User>
  }>(`/api/v1/users`, fetcher)

  return {
    mutateUsers: mutate,
    users: data ? data.users : undefined,
    isUsersLoading: !error && !data,
    isUsersError: error,
  }
}

export function useGetCurrentUser() {
  const { data, error, mutate } = useSWR<User>(`/api/v1/user`, fetcher)

  return {
    mutateCurrentUser: mutate,
    currentUser: data || undefined,
    isCurrentUserLoading: !error && !data,
    isCurrentUserError: error,
  }
}
