import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import Wrapper from '../../src/Wrapper'

type NewModelData = {
  teamName: string
  modelName: string
  description: string
  accessibility: 'public' | 'private'
}

export default function CreateNewModelWizard() {
  const [teamName, setTeamName] = useState('')
  const [modelName, setModelName] = useState('')
  const [description, setDescription] = useState('')
  const [accessibility, setAccessibility] = useState<NewModelData['accessibility']>('public')

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
  return (
    <Wrapper title='Create a new Model' page='marketplace'>
      <Card sx={{ p: 4 }}>
        <Typography variant='h4' color='primary'>
          Create a new Model
        </Typography>
        <Typography variant='h6' color='secondary'>
          A model repository contains all files, history and information related to a model.
        </Typography>
        <Box component='form' sx={{ mt: 4 }} onSubmit={onSubmit}>
          <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
            <>
              <Stack direction='row' divider={<Divider orientation='vertical' flexItem />} spacing={2}>
                <TextField required label='Team' value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                <TextField
                  required
                  label='Model name'
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </Stack>
              <TextField
                required
                label='Description'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </>
            <Divider />
            <>
              <RadioGroup
                defaultValue='public'
                value={accessibility}
                onChange={(e) => setAccessibility(e.target.value as NewModelData['accessibility'])}
              >
                <FormControlLabel
                  value='public'
                  control={<Radio />}
                  label='Public - Anyone on this instance can see this model'
                />
                <FormControlLabel
                  value='private'
                  control={<Radio />}
                  label='Private - You choose who can access this model'
                />
              </RadioGroup>
            </>
            <Divider />
            <Box sx={{ textAlign: 'right' }}>
              <Button variant='contained' type='submit'>
                Create Model
              </Button>
            </Box>
          </Stack>
        </Box>
      </Card>
    </Wrapper>
  )
}
