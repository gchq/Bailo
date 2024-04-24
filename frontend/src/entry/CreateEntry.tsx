import { FileUpload, Lock, LockOpen } from '@mui/icons-material'
import LoadingButton from '@mui/lab/LoadingButton'
import { Box, Card, Divider, FormControlLabel, Radio, RadioGroup, Stack, Tooltip, Typography } from '@mui/material'
import { postModel } from 'actions/model'
import { useRouter } from 'next/router'
import { FormEvent, useMemo, useState } from 'react'
import EntryDescriptionInput from 'src/entry/EntryDescriptionInput'
import EntryNameInput from 'src/entry/EntryNameInput'
import MessageAlert from 'src/MessageAlert'
import TeamSelect from 'src/TeamSelect'
import { EntryForm, EntryKind, EntryKindKeys, EntryKindLabel, EntryVisibility, TeamInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toTitleCase } from 'utils/stringUtils'

type CreateEntryProps = {
  kind: EntryKindKeys
}

export default function CreateEntry({ kind }: CreateEntryProps) {
  const router = useRouter()
  const [team, setTeam] = useState<TeamInterface | undefined>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<EntryForm['visibility']>(EntryVisibility.Public)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const isFormValid = useMemo(() => name && description, [name, description])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const formData: EntryForm = {
      name: name,
      teamId: team?.id ?? 'Uncategorised',
      kind,
      description,
      visibility,
    }
    const response = await postModel(formData)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
      setLoading(false)
    } else {
      const data = await response.json()
      router.push(`/${kind}/${data.model.id}`)
    }
  }

  const privateLabel = () => {
    return (
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
        <Lock />
        <Stack sx={{ my: 1 }}>
          <Typography fontWeight='bold'>Private</Typography>
          <Typography variant='caption'>
            {`Only named individuals will be able to view this ${EntryKindLabel[kind]}`}
          </Typography>
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
          <Typography variant='caption'>
            {`Any authorised user will be able to see this ${EntryKindLabel[kind]}`}
          </Typography>
        </Stack>
      </Stack>
    )
  }

  return (
    <Card sx={{ p: 4, m: 'auto' }}>
      <Stack spacing={2} alignItems='center' justifyContent='center'>
        <Typography variant='h6' component='h1' color='primary'>
          {`Create ${toTitleCase(kind)}`}
        </Typography>
        <FileUpload color='primary' fontSize='large' />
        {kind === EntryKind.MODEL && (
          <Typography>A model repository contains all files, history and information related to a model.</Typography>
        )}
      </Stack>
      <Box component='form' sx={{ mt: 4 }} onSubmit={handleSubmit}>
        <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
          <>
            <Typography component='h2' variant='h6'>
              Overview
            </Typography>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
              <TeamSelect value={team} onChange={(value) => setTeam(value)} />
              <EntryNameInput autoFocus value={name} kind={kind} onChange={(value) => setName(value)} />
            </Stack>
            <EntryDescriptionInput value={description} onChange={(value) => setDescription(value)} />
          </>
          <Divider />
          <>
            <Typography component='h3' variant='h6'>
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
          <Box sx={{ textAlign: 'right' }}>
            <Tooltip title={!isFormValid ? 'Please make sure all required fields are filled out' : ''}>
              <span>
                <LoadingButton
                  variant='contained'
                  disabled={!isFormValid}
                  type='submit'
                  data-test='createEntryButton'
                  loading={loading}
                >
                  {`Create ${EntryKindLabel[kind]}`}
                </LoadingButton>
              </span>
            </Tooltip>
            <MessageAlert message={errorMessage} severity='error' />
          </Box>
        </Stack>
      </Box>
    </Card>
  )
}
