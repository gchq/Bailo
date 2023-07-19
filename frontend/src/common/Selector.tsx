import { Autocomplete, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

export default function Selector() {
  const [teamName, setTeamName] = useState('')
  const [modelName, setModelName] = useState('')

  const team = [
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

  //   const modelNames = [
  //     { value: 'modelOne', label: 'model 1' },
  //     { value: 'modelTwo', label: 'model 2' },
  //     { value: 'modelThree', label: 'model 3' },
  //     { value: 'modelFour', label: 'model 4' },
  //   ]

  return (
    <Stack>
      <Typography sx={{ fontWeight: 'bold' }}>
        Team <span style={{ color: 'red' }}>*</span>
      </Typography>
      <Stack spacing={2} sx={{ width: 200 }}>
        <Autocomplete
          freeSolo
          options={team.map((option) => option.label)}
          renderInput={(params) => (
            <TextField
              {...params}
              required
              size='small'
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          )}
        />
      </Stack>
    </Stack>
  )

  //   return (
  //     <Stack>
  //       <Typography sx={{ fontWeight: 'bold' }}>
  //         Model name <span style={{ color: 'red' }}>*</span>
  //       </Typography>
  //       <Stack spacing={2} sx={{ width: 200 }}>
  //         <Autocomplete
  //           freeSolo
  //           options={modelNames.map((option) => option.label)}
  //           renderInput={(params) => (
  //             <TextField
  //               {...params}
  //               required
  //               size='small'
  //               value={modelName}
  //               onChange={(e) => setModelName(e.target.value)}
  //             />
  //           )}
  //         />
  //       </Stack>
  //     </Stack>
  //   )
}
