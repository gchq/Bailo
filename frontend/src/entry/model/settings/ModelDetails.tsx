import { Lock, LockOpen } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, Divider, FormControlLabel, Radio, RadioGroup, Stack, Tooltip, Typography } from '@mui/material'
import { patchModel } from 'actions/model'
import { useGetTeam } from 'actions/team'
import { FormEvent, useEffect, useState } from 'react'
import EntryDescriptionInput from 'src/entry/EntryDescriptionInput'
import EntryNameInput from 'src/entry/EntryNameInput'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import TeamSelect from 'src/TeamSelect'
import { EntryForm, EntryInterface, EntryKind, TeamInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type ModelAccessProps = {
  model: EntryInterface
}

export default function ModelDetails({ model }: ModelAccessProps) {
  const [team, setTeam] = useState<TeamInterface | undefined>()
  const [modelName, setModelName] = useState(model.name)
  const [description, setDescription] = useState(model.description)
  const [visibility, setVisibility] = useState<EntryForm['visibility']>(model.visibility)
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

    const formData: EntryForm = {
      name: modelName,
      kind: model.kind,
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
            <EntryNameInput
              autoFocus
              value={modelName}
              kind={EntryKind.MODEL}
              onChange={(value) => setModelName(value)}
            />
          </Stack>
          <EntryDescriptionInput value={description} onChange={(value) => setDescription(value)} />
        </>
        <Divider />
        <>
          <Typography variant='h6' component='h2'>
            Access control
          </Typography>
          <RadioGroup
            defaultValue='public'
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as EntryForm['visibility'])}
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
