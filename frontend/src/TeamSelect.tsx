import { Autocomplete, TextField } from '@mui/material'
import { useGetTeams } from 'actions/team'
import { SyntheticEvent } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import MessageAlert from 'src/MessageAlert'
import { TeamInterface } from 'types/types'

const htmlId = 'team-input'

type TeamSelectProps = {
  value: TeamInterface | undefined
  onChange: (value: TeamInterface | undefined) => void
  loading?: boolean
}

export default function TeamSelect({ value, onChange, loading = false }: TeamSelectProps) {
  const { teams, isTeamsLoading, isTeamsError } = useGetTeams()

  const handleChange = (_event: SyntheticEvent, newValue: TeamInterface | null) => {
    onChange(newValue ?? undefined)
  }

  if (isTeamsError) {
    return <MessageAlert message={isTeamsError.info.message} severity='error' />
  }

  // Replaced with a disabled TextField until teams are implemented
  return (
    <LabelledInput required label='Team' htmlFor={htmlId}>
      <TextField disabled id={htmlId} value='Uncategorised' size='small' />
    </LabelledInput>
  )

  // TODO - Use this autocomplete and remove the above TextField once teams have been implemented
  return (
    <LabelledInput required label='Team' htmlFor={htmlId}>
      <Autocomplete
        id={htmlId}
        value={value}
        options={teams}
        loading={isTeamsLoading || loading}
        onChange={handleChange}
        renderInput={(params) => <TextField {...params} required size='small' />}
        data-test='teamSelectInput'
      />
    </LabelledInput>
  )
}
