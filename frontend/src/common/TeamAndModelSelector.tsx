import { Autocomplete, Divider, Stack, TextField, Typography } from '@mui/material'
import { useGetModels } from 'actions/model'
import { useGetTeams } from 'actions/team'

export type TeamAndModelSelectorProps = {
  setTeamValue: (string) => void
  teamValue: string
  setModelValue: (string) => void
  modelValue: string
  teamReadOnly?: boolean
  modelReadOnly?: boolean
  teamOnly?: boolean
  modelOnly?: boolean
}

export default function TeamAndModelSelector({
  setTeamValue,
  setModelValue,
  teamValue,
  modelValue,
  teamReadOnly = false,
  modelReadOnly = false,
  teamOnly = false,
  modelOnly = false,
}: TeamAndModelSelectorProps) {
  const { teams, isTeamsLoading, isTeamsError } = useGetTeams()
  const { models, isModelLoading, isModelError } = useGetModels()
  const teamNames = teams
    ? teams.map((team) => {
        return { value: team.id, label: team.name }
      })
    : [
        { value: 'teamOne', label: 'team 1' },
        { value: 'teamTwo', label: 'team 2' },
      ]
  const modelNames = models
    ? models.map((model) => {
        return { value: model.id, label: model.name }
      })
    : []

  return (
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
        />
      )}
      {!teamOnly && (
        <Selector
          disabled={modelReadOnly}
          data={modelNames}
          setData={(value) => setModelValue(value)}
          label='Model'
          value={modelValue}
        />
      )}
    </Stack>
  )
}

interface SelectorProps {
  data: any
  setData: (value: string) => void
  label: string
  value: string
  disabled?: boolean
}

function Selector({ data, setData, label, value, disabled = false }: SelectorProps) {
  return (
    <Stack>
      <Typography sx={{ fontWeight: 'bold' }}>
        {label} <span style={{ color: 'red' }}>*</span>
      </Typography>
      <Stack spacing={2} sx={{ width: 200 }}>
        <Autocomplete
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
