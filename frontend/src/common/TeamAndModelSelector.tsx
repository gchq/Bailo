import { Autocomplete, Divider, FormControl, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

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
            />
          )}
          {!teamOnly && (
            <Selector data={modelNames} setData={(value) => setModelValue(value)} label='Model' value={modelValue} />
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
  const theme = useTheme()
  return (
    <FormControl>
      <Stack>
        <Typography component='label' sx={{ fontWeight: 'bold' }} htmlFor={`${label}-input`}>
          {label} <span style={{ color: theme.palette.primary.main }}>*</span>
        </Typography>
        <Autocomplete
          loading={loading}
          id={`${label}-input`}
          sx={{ width: 200 }}
          freeSolo
          tabIndex={0}
          autoSelect
          onChange={(_event, newValue: string | null) => setData(newValue ? newValue : '')}
          options={data.map((option) => option.label)}
          value={value}
          renderInput={(params) => <TextField {...params} required size='small' value={data} />}
          disabled={disabled}
        />
      </Stack>
    </FormControl>
  )
}
