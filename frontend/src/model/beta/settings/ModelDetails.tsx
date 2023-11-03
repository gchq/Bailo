import { Lock, LockOpen } from '@mui/icons-material'
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'

import { patchModel } from '../../../../actions/model'
import { ModelForm, ModelInterface } from '../../../../types/v2/types'
import { getErrorMessage } from '../../../../utils/fetcher'
import useNotification from '../../../common/Snackbar'
import TeamAndModelSelector from '../../../common/TeamAndModelSelector'
import MessageAlert from '../../../MessageAlert'

type ModelAccessProps = {
  model: ModelInterface
}

export default function ModelDetails({ model }: ModelAccessProps) {
  const [teamName, setTeamName] = useState(model.team)
  const [modelName, setModelName] = useState(model.name)
  const [description, setDescription] = useState(model.description)
  const [visibility, setVisibility] = useState<ModelForm['visibility']>(model.visibility)
  const [errorMessage, setErrorMessage] = useState('')

  const theme = useTheme()
  const sendNotification = useNotification()

  const formValid = teamName && modelName && description

  async function onSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    const formData: ModelForm = {
      name: modelName,
      team: teamName,
      description,
      visibility,
    }
    const response = await patchModel(model.id, formData)

    if (!response.ok) {
      const error = await getErrorMessage(response)
      return setErrorMessage(error)
    }

    sendNotification({
      variant: 'success',
      msg: 'Model updated',
      anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
    })
  }

  const privateLabel = () => {
    return (
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
        <Lock />
        <Stack sx={{ my: 1 }}>
          <Typography sx={{ fontWeight: 'bold' }}>Private</Typography>
          <Typography variant='caption'>Only named individuals will be able to view this model</Typography>
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
          <Typography variant='caption'>Any authorised user will be able to see this model</Typography>
        </Stack>
      </Stack>
    )
  }

  return (
    <Box component='form' onSubmit={onSubmit}>
      <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
        <>
          <Typography variant='h6' component='h2'>
            Model Details
          </Typography>
          <Box sx={{ width: '100%' }}>
            <TeamAndModelSelector
              setTeamValue={setTeamName}
              teamValue={teamName}
              setModelValue={setModelName}
              modelValue={modelName}
            />
          </Box>
          <Stack>
            <FormControl>
              <Typography sx={{ fontWeight: 'bold' }}>
                Description <span style={{ color: theme.palette.primary.main }}>*</span>
              </Typography>
              <TextField
                data-test='modelDescription'
                onChange={(event) => setDescription(event.target.value)}
                value={description}
                size='small'
              />
            </FormControl>
          </Stack>
        </>
        <Divider />
        <>
          <Typography component='h3' variant='h6'>
            Access control
          </Typography>
          <RadioGroup
            defaultValue='public'
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as ModelForm['visibility'])}
          >
            <FormControlLabel
              value='public'
              control={<Radio />}
              label={publicLabel()}
              data-test='publicButtonSelector'
            />
            <FormControlLabel
              value='private'
              control={<Radio />}
              label={privateLabel()}
              data-test='privateButtonSelector'
            />
          </RadioGroup>
        </>
        <Divider />
        <Tooltip title={!formValid ? 'Please make sure all required fields are filled out' : ''}>
          <span>
            <Button variant='contained' disabled={!formValid} type='submit' data-test='createModelButton'>
              Save
            </Button>
          </span>
        </Tooltip>
        <MessageAlert message={errorMessage} severity='error' />
      </Stack>
    </Box>
  )
}
