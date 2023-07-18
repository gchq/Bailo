import { Lock, LockOpen } from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Divider,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { NewModelData } from 'types/types'

import Wrapper from '../../../../src/Wrapper.beta'

export default function NewModel() {
  const [teamName, setTeamName] = useState('')
  const [modelName, setModelName] = useState('')
  const [description, setDescription] = useState('')
  const [accessibility, setAccessibility] = useState<NewModelData['accessibility']>('public')

  const formValid = teamName && modelName && description

  function onSubmit(event) {
    event.preventDefault()
    const formData: NewModelData = {
      teamName,
      modelName,
      description,
      accessibility,
    }
    // TODO - after new model page is implemented, forward this data
    console.log(formData)
  }

  const privateLabel = () => {
    return (
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
        <Lock />
        <Stack sx={{ my: 1 }}>
          <Typography sx={{ fontWeight: 'bold' }}>Private</Typography>
          <Typography variant='caption'>You choose who can access this model</Typography>
        </Stack>
      </Stack>
    )
  }

  const publicLabel = () => {
    return (
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
        <LockOpen />
        <Stack sx={{ my: 1 }}>
          <Typography sx={{ fontWeight: 'bold' }}>Public</Typography>
          <Typography variant='caption'>You choose who can access this model</Typography>
        </Stack>
      </Stack>
    )
  }

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

  const modelNames = [
    { value: 'modelOne', label: 'model 1' },
    { value: 'modelTwo', label: 'model 2' },
    { value: 'modelThree', label: 'model 3' },
    { value: 'modelFour', label: 'model 4' },
  ]

  return (
    <Wrapper title='Create a new Model' page='marketplace'>
      <Card sx={{ p: 4, maxWidth: 500, m: 'auto' }}>
        <Typography variant='h4' sx={{ fontWeight: 'bold' }} color='primary'>
          Create a new model
        </Typography>
        <Typography>A model repository contains all files, history and information related to a model.</Typography>
        <Box component='form' sx={{ mt: 4 }} onSubmit={onSubmit}>
          <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
            <>
              <Typography variant='h6'>Overview</Typography>
              <Stack direction='row' spacing={2}>
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
                <Stack>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    Model name <span style={{ color: 'red' }}>*</span>
                  </Typography>
                  <Stack spacing={2} sx={{ width: 200 }}>
                    <Autocomplete
                      freeSolo
                      options={modelNames.map((option) => option.label)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          size='small'
                          value={modelName}
                          onChange={(e) => setModelName(e.target.value)}
                        />
                      )}
                    />
                  </Stack>
                </Stack>
              </Stack>
              <Stack>
                <Typography sx={{ fontWeight: 'bold' }}>
                  Description <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField required size='small' value={description} onChange={(e) => setDescription(e.target.value)} />
              </Stack>
            </>
            <Divider />
            <>
              <Typography variant='h6'>Access control</Typography>
              <RadioGroup
                defaultValue='public'
                value={accessibility}
                onChange={(e) => setAccessibility(e.target.value as NewModelData['accessibility'])}
              >
                <FormControlLabel value='public' control={<Radio />} label={publicLabel()} />
                <FormControlLabel value='private' control={<Radio />} label={privateLabel()} />
              </RadioGroup>
            </>
            <Divider />
            <Box sx={{ textAlign: 'right' }}>
              <Tooltip title={!formValid ? 'Please make sure all required fields are filled out' : ''}>
                <span>
                  <Button variant='contained' disabled={!formValid} type='submit'>
                    Create Model
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Stack>
        </Box>
      </Card>
    </Wrapper>
  )
}
