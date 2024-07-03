import { ArrowBack, FileUpload, Lock, LockOpen } from '@mui/icons-material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LoadingButton from '@mui/lab/LoadingButton'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { postModel } from 'actions/model'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { FormEvent, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import EntryDescriptionInput from 'src/entry/EntryDescriptionInput'
import EntryNameInput from 'src/entry/EntryNameInput'
import EntryAccess from 'src/entry/settings/EntryAccess'
import SourceModelInput from 'src/entry/SourceModelnput'
import MessageAlert from 'src/MessageAlert'
import TeamSelect from 'src/TeamSelect'
import {
  CollaboratorEntry,
  EntityKind,
  EntryForm,
  EntryKind,
  EntryKindKeys,
  EntryKindLabel,
  EntryVisibility,
  TeamInterface,
} from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toTitleCase } from 'utils/stringUtils'

type CreateEntryProps = {
  kind: EntryKindKeys
  entryKind
  onBackClick: () => void
}

export default function CreateEntry({ kind, entryKind, onBackClick }: CreateEntryProps) {
  const router = useRouter()

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const [team, setTeam] = useState<TeamInterface | undefined>()
  const [name, setName] = useState('')
  const [sourceModelId, setSourceModelId] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<EntryForm['visibility']>(EntryVisibility.Public)
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>(
    currentUser ? [{ entity: `${EntityKind.USER}:${currentUser?.dn}`, roles: ['owner'] }] : [],
  )
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const isFormValid = useMemo(() => name && description, [name, description])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const formData: EntryForm = {
      name,
      teamId: team?.id ?? 'Uncategorised',
      kind,
      description,
      visibility,
      collaborators,
      settings: {
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
            {`Only named individuals will be able to view this ${EntryKindLabel[entryKind]}`}
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
            {`Any authorised user will be able to see this ${EntryKindLabel[entryKind]}`}
          </Typography>
        </Stack>
      </Stack>
    )
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      <Card sx={{ p: 4, mb: 4 }}>
        <Stack spacing={1}>
          <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />} onClick={() => onBackClick()}>
            Back
          </Button>
          <Stack spacing={2} alignItems='center' justifyContent='center'>
            <Typography variant='h6' component='h1' color='primary'>
              {`Create ${toTitleCase(entryKind)}`}
            </Typography>
            <FileUpload color='primary' fontSize='large' />
            {kind === EntryKind.MODEL && (
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
                <TeamSelect value={team} onChange={(value) => setTeam(value)} />
                <EntryNameInput autoFocus value={name} kind={kind} onChange={(value) => setName(value)} />
                {entryKind === EntryKind.MIRRORED_MODEL && (
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
                  <EntryAccess
                    value={collaborators}
                    onUpdate={(val) => setCollaborators(val)}
                    entryKind={EntryKind.MODEL}
                    entryRoles={[
                      { id: 'owner', name: 'Owner' },
                      { id: 'contributor', name: 'Contributor' },
                      { id: 'consumer', name: 'Consumer' },
                    ]}
                  />
                </Box>
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
                    {`Create ${EntryKindLabel[entryKind]}`}
                  </LoadingButton>
                </span>
              </Tooltip>
              <MessageAlert message={errorMessage} severity='error' />
            </Box>
          </Stack>
        </Box>
      </Card>
    </>
  )
}
