import { Typography } from '@mui/material'
import { useGetTeams } from 'actions/team'
import { useMemo } from 'react'
import Selector from 'src/common/Selector'
import MessageAlert from 'src/MessageAlert'

export type TeamSelectorProps = {
  value: string
  onChange: (value: string) => void
}

export default function TeamSelector({ value, onChange }: TeamSelectorProps) {
  const { teams, isTeamsLoading, isTeamsError } = useGetTeams()

  const teamNames = useMemo(() => (teams ? teams.map((team) => team.name) : []), [teams])

  if (isTeamsError) {
    return <MessageAlert message={isTeamsError.info.message} severity='error' />
  }

  return (
    <>
      {isTeamsLoading && <Typography>Fetching Teams</Typography>}
      {!isTeamsLoading && (
        <Selector
          label='Team'
          value={value}
          options={teamNames}
          disabled={true} // Disabled until teams are implemented
          loading={isTeamsLoading}
          onChange={onChange}
        />
      )}
    </>
  )
}
