import { Autocomplete, Divider, Stack, TextField, Typography } from '@mui/material'

import { useGetTeams } from '../../actions/team'

export type TeamAndModelSelectorProps = {
  setTeamValue: (string) => void
  teamValue: string
  setModelValue: (string) => void
  modelValue: string
  teamReadOnly?: boolean
  teamOnly?: boolean
  modelOnly?: boolean
}

export default function TeamAndModelSelector({
  setTeamValue,
  setModelValue,
  teamValue,
  modelValue,
  teamReadOnly = false,
  teamOnly = false,
  modelOnly = false,
}: TeamAndModelSelectorProps) {
  const { teams, isTeamsLoading } = useGetTeams()

  const teamNames = teams
    ? teams.map((team) => {
        return { value: team.id, label: team.name }
      })
    : []

  const modelNames = []

  return (
    <>
      {isTeamsLoading && <Typography>Fetching Teams</Typography>}{' '}
      {!isTeamsLoading && (
        <Stack
          spacing={2}
          direction={{ xs: 'column', sm: 'row' }}
          divider={<Divider variant='middle' flexItem orientation='vertical' />}
        >
          {!modelOnly && (
            <Selector
              data={teamNames}
              setData={(value) => setTeamValue(value)}
              label='Team'
              value={teamValue}
              disabled={teamReadOnly}
              loading={isTeamsLoading}
              data-test='teamSelector'
            />
          )}
          {!teamOnly && (
            <Selector
              data={modelNames}
              setData={(value) => setModelValue(value)}
              label='Model'
              value={modelValue}
              data-test='modelSelector'
            />
          )}
        </Stack>
      )}
    </>
  )
}

interface SelectorProps {
  data: any
  setData: (value: string) => void
  label: string
  value: string
  disabled?: boolean
  loading?: boolean
}

function Selector({ data, setData, label, value, disabled = false, loading = false }: SelectorProps) {
  return (
    <Stack>
      <Typography sx={{ fontWeight: 'bold' }}>
        {label} <span style={{ color: 'red' }}>*</span>
      </Typography>
      <Stack spacing={2} sx={{ width: 200 }}>
        <Autocomplete
          loading={loading}
          freeSolo
          onChange={(_event, newValue: string | null) => setData(newValue ? newValue : '')}
          options={data.map((option) => option.label)}
          value={value}
          renderInput={(params) => <TextField {...params} required size='small' value={data} />}
          disabled={disabled}
        />
      </Stack>
    </Stack>
  )
}
