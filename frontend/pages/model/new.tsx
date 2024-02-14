import { FileUpload, Lock, LockOpen } from '@mui/icons-material'
import LoadingButton from '@mui/lab/LoadingButton'
import {
  Box,
  Card,
  Container,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { postModel } from 'actions/model'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import ModelDescriptionInput from 'src/model/ModelDescriptionInput'
import ModelNameInput from 'src/model/ModelNameInput'
import TeamSelect from 'src/TeamSelect'
import Wrapper from 'src/Wrapper'
import { TeamInterface } from 'types/interfaces'
import { ModelForm, ModelVisibility } from 'types/v2/types'
import { getErrorMessage } from 'utils/fetcher'

export default function NewModel() {
  const [team, setTeam] = useState<TeamInterface | undefined>()
  const [modelName, setModelName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<ModelForm['visibility']>(ModelVisibility.Public)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const formValid = modelName && description

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const formData: ModelForm = {
      name: modelName,
      teamId: team?.id ?? 'Uncategorised',
      description,
      visibility,
    }
    const response = await postModel(formData)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
      setLoading(false)
    } else {
      const data = await response.json()
      router.push(`/model/${data.model.id}`)
    }
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

  return (
    <Wrapper title='Create a new Model' page='upload'>
      <Container maxWidth='sm'>
        <Card sx={{ p: 4, m: 'auto' }}>
          <Stack spacing={2} alignItems='center' justifyContent='center'>
            <Typography data-test='createModelPageTitle' variant='h6' component='h1' color='primary'>
              Upload a new Model
            </Typography>
            <FileUpload color='primary' fontSize='large' />
            <Typography>A model repository contains all files, history and information related to a model.</Typography>
          </Stack>
          <Box component='form' sx={{ mt: 4 }} onSubmit={handleSubmit}>
            <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
              <>
                <Typography component='h2' variant='h6'>
                  Overview
                </Typography>
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                  <TeamSelect value={team} onChange={(value) => setTeam(value)} />
                  <ModelNameInput value={modelName} onChange={(value) => setModelName(value)} />
                </Stack>
                <ModelDescriptionInput value={description} onChange={(value) => setDescription(value)} />
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
              <Box sx={{ textAlign: 'right' }}>
                <Tooltip title={!formValid ? 'Please make sure all required fields are filled out' : ''}>
                  <span>
                    <LoadingButton
                      variant='contained'
                      disabled={!formValid}
                      type='submit'
                      data-test='createModelButton'
                      loading={loading}
                    >
                      Create Model
                    </LoadingButton>
                  </span>
                </Tooltip>
                <MessageAlert message={errorMessage} severity='error' />
              </Box>
            </Stack>
          </Box>
        </Card>
      </Container>
    </Wrapper>
  )
}
