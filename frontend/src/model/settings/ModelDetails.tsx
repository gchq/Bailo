import { Lock, LockOpen } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, Divider, FormControlLabel, Radio, RadioGroup, Stack, Tooltip, Typography } from '@mui/material'
import { useGetTeam } from 'actions/team'
import { FormEvent, useEffect, useState } from 'react'
import ModelDescriptionInput from 'src/model/ModelDescriptionInput'
import ModelNameInput from 'src/model/ModelNameInput'
import TeamSelect from 'src/TeamSelect'
import { ModelForm, ModelInterface, TeamInterface } from 'types/types'

import { patchModel } from '../../../actions/model'
import { getErrorMessage } from '../../../utils/fetcher'
import useNotification from '../../hooks/useNotification'
import MessageAlert from '../../MessageAlert'

type ModelAccessProps = {
  model: ModelInterface
}

export default function ModelDetails({ model }: ModelAccessProps) {
  const [team, setTeam] = useState<TeamInterface | undefined>()
  const [modelName, setModelName] = useState(model.name)
  const [description, setDescription] = useState(model.description)
  const [visibility, setVisibility] = useState<ModelForm['visibility']>(model.visibility)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const sendNotification = useNotification()
  const { team: modelTeam, isTeamLoading, isTeamError } = useGetTeam(model.teamId)

  useEffect(() => {
    setTeam(modelTeam)
  }, [modelTeam])

  const formValid = team && modelName && description

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    const formData: ModelForm = {
      name: modelName,
      teamId: team?.id ?? 'Uncategorised',
      description,
      visibility,
    }
    const response = await patchModel(model.id, formData)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      sendNotification({
        variant: 'success',
        msg: 'Model updated',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
    setIsLoading(false)
  }

  const privateLabel = () => {
    return (
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
        <Lock />
        <Stack sx={{ my: 1 }}>
          <Typography fontWeight='bold'>Private</Typography>
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
          <Typography fontWeight='bold'>Public</Typography>
          <Typography variant='caption'>Any authorised user will be able to see this model</Typography>
        </Stack>
      </Stack>
    )
  }

  if (isTeamError) {
    return <MessageAlert message={isTeamError.info.message} severity='error' />
  }

  return (
    <Box component='form' onSubmit={onSubmit}>
      <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
        <>
          <Typography variant='h6' component='h2'>
            Model Details
          </Typography>
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <TeamSelect value={team} loading={isTeamLoading} onChange={(value) => setTeam(value)} />
            <ModelNameInput
              inputProps={{ autoFocus: true }}
              value={modelName}
              onChange={(value) => setModelName(value)}
            />
          </Stack>
          <ModelDescriptionInput value={description} onChange={(value) => setDescription(value)} />
        </>
        <Divider />
        <>
          <Typography variant='h6' component='h2'>
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
            <LoadingButton variant='contained' loading={isLoading} disabled={!formValid} type='submit'>
              Save
            </LoadingButton>
          </span>
        </Tooltip>
        <MessageAlert message={errorMessage} severity='error' />
      </Stack>
    </Box>
  )
}
