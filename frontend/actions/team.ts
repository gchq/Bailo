import { ErrorInfo } from 'react'
import useSWR from 'swr'
import { TeamInterface } from 'types/interfaces'
import { fetcher } from 'utils/fetcher'

export function useGetTeams() {
  const { data, error, mutate } = useSWR<
    {
      teams: TeamInterface[]
    },
    ErrorInfo
  >('/api/v2/teams/', fetcher)

  return {
    mutateTeams: mutate,
    teams: data ? data.teams : undefined,
    isTeamsLoading: !error && !data,
    isTeamsError: error,
  }
}
