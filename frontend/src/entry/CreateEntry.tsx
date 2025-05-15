import { ArrowBack, FileUpload, FolderCopy, Gavel, Lock, LockOpen } from '@mui/icons-material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LoadingButton from '@mui/lab/LoadingButton'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material'
import { postModel } from 'actions/model'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { FormEvent, useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import EntryDescriptionInput from 'src/entry/EntryDescriptionInput'
import EntryNameInput from 'src/entry/EntryNameInput'
import EntryOrganisationInput from 'src/entry/EntryOrganisationInput'
import EntryAccessInput from 'src/entry/settings/EntryAccessInput'
import SourceModelInput from 'src/entry/SourceModelInput'
import MessageAlert from 'src/MessageAlert'
import {
  CollaboratorEntry,
  CreateEntryKind,
  CreateEntryKindKeys,
  EntityKind,
  EntryForm,
  EntryKind,
  EntryKindKeys,
  EntryKindLabel,
  EntryVisibility,
} from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toTitleCase } from 'utils/stringUtils'

type CreateEntryProps = {
  createEntryKind: CreateEntryKindKeys
  onBackClick: () => void
}

export default function CreateEntry({ createEntryKind, onBackClick }: CreateEntryProps) {
  const router = useRouter()

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const [name, setName] = useState('')
  const [sourceModelId, setSourceModelId] = useState('')
  const [description, setDescription] = useState('')
  const [organisation, setOrganisation] = useState<string>('')
  const [visibility, setVisibility] = useState<EntryForm['visibility']>(EntryVisibility.Public)
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>(
    currentUser ? [{ entity: `${EntityKind.USER}:${currentUser?.dn}`, roles: ['owner'] }] : [],
  )
  const [ungovernedAccess, setUngovernedAccess] = useState(false)
  const [allowTemplating, setAllowTemplating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const entryKind: EntryKindKeys = useMemo(
    () => (createEntryKind === CreateEntryKind.MIRRORED_MODEL ? EntryKind.MODEL : createEntryKind),
    [createEntryKind],
  )

  const isFormValid = useMemo(
    () => name && description && (sourceModelId || createEntryKind !== CreateEntryKind.MIRRORED_MODEL),
    [name, description, createEntryKind, sourceModelId],
  )

  const handleCollaboratorsChange = useCallback(
    (updatedCollaborators: CollaboratorEntry[]) => setCollaborators(updatedCollaborators),
    [],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const formData: EntryForm = {
      name,
      kind: entryKind,
      description,
      organisation,
      visibility,
      collaborators,
      settings: {
        ungovernedAccess,
        allowTemplating,
        mirror: {
          sourceModelId,
        },
      },
    }
    const response = await postModel(formData)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
      setLoading(false)
    } else {
      const data = await response.json()
      router.push(`/${entryKind}/${data.model.id}`)
    }
  }

  const privateLabel = useMemo(() => {
    return (
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
        <Lock />
        <Stack sx={{ my: 1 }}>
          <Typography fontWeight='bold'>Private</Typography>
          <Typography variant='caption'>
            {`Only named individuals will be able to view this ${EntryKindLabel[createEntryKind]}`}
          </Typography>
        </Stack>
      </Stack>
    )
  }, [createEntryKind])

  const publicLabel = useMemo(() => {
    return (
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
        <LockOpen />
        <Stack sx={{ my: 1 }}>
          <Typography fontWeight='bold'>Public</Typography>
          <Typography variant='caption'>
            {`Any authorised user will be able to see this ${EntryKindLabel[createEntryKind]}`}
          </Typography>
        </Stack>
      </Stack>
    )
  }, [createEntryKind])

  const allowTemplatingLabel = useMemo(() => {
    return (
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
        <FolderCopy />
        <Stack sx={{ my: 1 }}>
          <Typography fontWeight='bold'>Templating</Typography>
          <Typography variant='caption'>
            {`Allow this to be used as a template for another ${EntryKindLabel[createEntryKind]}`}
          </Typography>
        </Stack>
      </Stack>
    )
  }, [createEntryKind])

  const ungovernedAccessLabel = useMemo(() => {
    return (
      <Stack direction='row' justifyContent='center' alignItems='center' spacing={1}>
        <Gavel />
        <Stack sx={{ my: 1 }}>
          <Typography fontWeight='bold'>Ungoverned Access Requests</Typography>
          <Typography variant='caption'>
            {`Allow users to request access without the need for authorisation from ${EntryKindLabel[createEntryKind]} owners`}
          </Typography>
        </Stack>
      </Stack>
    )
  }, [createEntryKind])

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Stack spacing={1}>
          <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />} onClick={() => onBackClick()}>
            Back
          </Button>
          <Stack spacing={2} alignItems='center' justifyContent='center'>
            <Typography variant='h6' component='h1' color='primary'>
              {`Create ${toTitleCase(createEntryKind)}`}
            </Typography>
            <FileUpload color='primary' fontSize='large' />
            {createEntryKind === CreateEntryKind.MODEL && (
              <Typography>
                A model repository contains all files, history and information related to a model.
              </Typography>
            )}
          </Stack>
        </Stack>
        <Box component='form' sx={{ mt: 4 }} onSubmit={handleSubmit}>
          <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
            <>
              <Typography component='h2' variant='h6'>
                Overview
              </Typography>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <EntryNameInput autoFocus value={name} kind={entryKind} onChange={(value) => setName(value)} />
                <EntryOrganisationInput value={organisation} onChange={(value) => setOrganisation(value)} />
                {createEntryKind === CreateEntryKind.MIRRORED_MODEL && (
                  <SourceModelInput onChange={(value) => setSourceModelId(value)} value={sourceModelId} />
                )}
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
                  label={publicLabel}
                  data-test='publicButtonSelector'
                />
                <FormControlLabel
                  value='private'
                  control={<Radio />}
                  label={privateLabel}
                  data-test='privateButtonSelector'
                />
              </RadioGroup>
            </>
            <Accordion sx={{ borderTop: 'none' }}>
              <AccordionSummary
                sx={{ pl: 0 }}
                expandIcon={<ExpandMoreIcon />}
                aria-controls='panel1-content'
                id='panel1-header'
              >
                <Typography component='h3' variant='h6'>
                  Advanced (optional)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant='h6' component='h2'>
                  Manage access list
                </Typography>
                <Typography variant='caption'>
                  Please note that only entry roles can be added at this stage, and review roles should be added once a
                  schema has been selected.
                </Typography>
                <Box sx={{ marginTop: 1 }}>
                  <EntryAccessInput
                    value={collaborators}
                    onChange={handleCollaboratorsChange}
                    entryKind={entryKind}
                    entryRoles={[
                      { id: 'owner', name: 'Owner' },
                      { id: 'contributor', name: 'Contributor' },
                      { id: 'consumer', name: 'Consumer' },
                    ]}
                  />
                </Box>
                <Stack spacing={2}>
                  <Typography variant='h6' component='h2'>
                    Additional settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        onChange={(e) => setUngovernedAccess(e.target.checked)}
                        checked={ungovernedAccess}
                        size='small'
                      />
                    }
                    label={ungovernedAccessLabel}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        onChange={(event) => setAllowTemplating(event.target.checked)}
                        checked={allowTemplating}
                        size='small'
                      />
                    }
                    label={allowTemplatingLabel}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>
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
                    {`Create ${EntryKindLabel[createEntryKind]}`}
                  </LoadingButton>
                </span>
              </Tooltip>
              <MessageAlert message={errorMessage} severity='error' />
            </Box>
          </Stack>
        </Box>
      </Paper>
    </>
  )
}
