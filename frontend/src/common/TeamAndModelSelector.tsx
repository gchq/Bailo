import { Autocomplete, Divider, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

export default function TeamAndModelSelector() {
  const [_selectedTeam, setSelectedTeam] = useState('')
  const [_selectedModel, setSelectedModel] = useState('')

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
    <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} divider={<Divider flexItem orientation='vertical' />}>
      <Selector data={teamNames} setData={(value) => setSelectedTeam(value)} label='Team' />
      <Selector data={modelNames} setData={(value) => setSelectedModel(value)} label='Model' />
    </Stack>
  )
}

interface SelectorProps {
  data: any
  setData: (value: string) => void
  label: string
}

function Selector({ data, setData, label }: SelectorProps) {
  return (
    <Stack>
      <Typography sx={{ fontWeight: 'bold' }}>
        {label} <span style={{ color: 'red' }}>*</span>
      </Typography>
      <Stack spacing={2} sx={{ width: 200 }}>
        <Autocomplete
          freeSolo
          options={data.map((option) => option.label)}
          renderInput={(params) => (
            <TextField {...params} required size='small' value={data} onChange={(e) => setData(e.target.value)} />
          )}
        />
      </Stack>
    </Stack>
  )
}
