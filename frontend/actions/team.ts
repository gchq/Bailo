import useSWR from 'swr'
import { TeamInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

const emptyArray = []

export const useGetTeams = () => {
  const { data, isLoading, error, mutate } = useSWR<
    {
      teams: TeamInterface[]
    },
    ErrorInfo
  >('/api/v2/teams/', fetcher)

  return {
    teams: data ? data.teams : emptyArray,
    isTeamsLoading: isLoading,
    isTeamsError: error,
    mutateTeams: mutate,
  }
}

export const useGetTeam = (teamId: string) => {
  const { data, isLoading, error, mutate } = useSWR<
    {
      team: TeamInterface
    },
    ErrorInfo
  >(`/api/v2/team/${teamId}`, fetcher)

  return {
    team: data ? data.team : undefined,
    isTeamLoading: isLoading,
    isTeamError: error,
    mutateTeam: mutate,
  }
}
