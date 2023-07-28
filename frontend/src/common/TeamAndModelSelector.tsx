import { Autocomplete, Divider, Stack, TextField, Typography } from '@mui/material'

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
  const teamNames = [
    { value: 'teamOne', label: 'team 1' },
    { value: 'teamTwo', label: 'team 2' },
    { value: 'teamThree', label: 'team 3' },
    { value: 'teamFour', label: 'team 4' },
    { value: 'teamFive', label: 'team 5' },
    { value: 'teamSix', label: 'team 6' },
    { value: 'teamSeven', label: 'team 7' },
    { value: 'teamEight', label: 'team 8' },
    { value: 'teamNine', label: 'team 9' },
    { value: 'teamTen', label: 'team 10' },
    { value: 'teamEleven', label: 'team 11' },
    { value: 'teamTwelve', label: 'team 12' },
    { value: 'teamThirteen', label: 'team 13' },
    { value: 'teamFourteen', label: 'team 14' },
    { value: 'teamFifteen', label: 'team 15' },
    { value: 'teamSixteen', label: 'team 16' },
  ]

  const modelNames = [
    { value: 'modelOne', label: 'model 1' },
    { value: 'modelTwo', label: 'model 2' },
    { value: 'modelThree', label: 'model 3' },
    { value: 'modelFour', label: 'model 4' },
  ]

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
