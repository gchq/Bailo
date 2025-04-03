import { Lock, LockOpen } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { Box, Divider, FormControlLabel, Radio, RadioGroup, Stack, Tooltip, Typography } from '@mui/material'
import { patchModel } from 'actions/model'
import { FormEvent, useMemo, useState } from 'react'
import EntryDescriptionInput from 'src/entry/EntryDescriptionInput'
import EntryNameInput from 'src/entry/EntryNameInput'
import EntryOrganisationInput from 'src/entry/EntryOrganisationInput'
import EntryStateInput from 'src/entry/EntryStateInput'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, EntryKindLabel, UpdateEntryForm } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toSentenceCase, toTitleCase } from 'utils/stringUtils'

type EntryDetailsProps = {
  entry: EntryInterface
}

export default function EntryDetails({ entry }: EntryDetailsProps) {
  const [name, setName] = useState(entry.name)
  const [description, setDescription] = useState(entry.description)
  const [organisation, setOrganisation] = useState(entry.organisation || '')
  const [state, setState] = useState(entry.state || '')
  const [visibility, setVisibility] = useState<UpdateEntryForm['visibility']>(entry.visibility)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const sendNotification = useNotification()

  const isFormValid = useMemo(() => name && description, [name, description])

  const saveButtonTooltip = useMemo(() => {
    if (!isFormValid) {
      return 'Please make sure all required fields are filled out'
    }
    return ''
  }, [isFormValid])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    const formData: UpdateEntryForm = {
      name,
      description,
      visibility,
      organisation: organisation || '',
      state: state || '',
    }
    const response = await patchModel(entry.id, formData)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      sendNotification({
        variant: 'success',
        msg: `${toSentenceCase(EntryKindLabel[entry.kind])} updated`,
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
          <Typography variant='caption'>{`Only named individuals will be able to view this ${
            EntryKindLabel[entry.kind]
          }`}</Typography>
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
          <Typography variant='caption'>{`Any authorised user will be able to see this ${
            EntryKindLabel[entry.kind]
          }`}</Typography>
        </Stack>
      </Stack>
    )
  }

  return (
    <Box component='form' onSubmit={onSubmit}>
      <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
        <>
          <Typography variant='h6' component='h2'>
            {`${toTitleCase(EntryKindLabel[entry.kind])} Details`}
          </Typography>
          <EntryNameInput autoFocus value={name} kind={entry.kind} onChange={(value) => setName(value)} />
          <EntryOrganisationInput value={organisation} onChange={(value) => setOrganisation(value)} />
          <EntryDescriptionInput value={description} onChange={(value) => setDescription(value)} />
          <EntryStateInput value={state} onChange={(value) => setState(value)} />
        </>
        <Divider />
        <>
          <Typography variant='h6' component='h2'>
            Access control
          </Typography>
          <RadioGroup
            defaultValue='public'
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as UpdateEntryForm['visibility'])}
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
        <div>
          <Tooltip title={saveButtonTooltip}>
            <span>
              <LoadingButton variant='contained' loading={isLoading} disabled={!isFormValid} type='submit'>
                Save
              </LoadingButton>
            </span>
          </Tooltip>
        </div>
        <MessageAlert message={errorMessage} severity='error' />
      </Stack>
    </Box>
  )
}
