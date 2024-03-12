import useSWR from 'swr'
import { TeamInterface } from 'types/types'
import { ErrorInfo, fetcher } from 'utils/fetcher'

export const useGetTeams = () => {
  const { data, error, mutate } = useSWR<
    {
      teams: TeamInterface[]
    },
    ErrorInfo
  >('/api/v2/teams/', fetcher)

  return {
    teams: data ? data.teams : [],
    isTeamsLoading: !error && !data,
    isTeamsError: error,
    mutateTeams: mutate,
  }
}

export const useGetTeam = (teamId: string) => {
  const { data, error, mutate } = useSWR<
    {
      team: TeamInterface
    },
    ErrorInfo
  >(`/api/v2/team/${teamId}`, fetcher)

  return {
    team: data ? data.team : undefined,
    isTeamLoading: !error && !data,
    isTeamError: error,
    mutateTeam: mutate,
  }
}
