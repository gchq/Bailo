import ArrowBack from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FileUpload from '@mui/icons-material/FileUpload'
import FolderCopy from '@mui/icons-material/FolderCopy'
import Gavel from '@mui/icons-material/Gavel'
import Lock from '@mui/icons-material/Lock'
import LockOpen from '@mui/icons-material/LockOpen'
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
import { postEntry, useGetEntryRoles } from 'actions/entry'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { SyntheticEvent, useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import EntryDescriptionInput from 'src/entry/EntryDescriptionInput'
import EntryNameInput from 'src/entry/EntryNameInput'
import EntryOrganisationInput from 'src/entry/EntryOrganisationInput'
import EntryAccessInput from 'src/entry/settings/EntryAccessInput'
import SourceModelInput from 'src/entry/SourceModelInput'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import TagSelector from 'src/MuiForms/TagSelector'
import {
  CollaboratorEntry,
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
  createEntryKind: EntryKindKeys
  onBackClick: () => void
}

export default function CreateEntry({ createEntryKind, onBackClick }: CreateEntryProps) {
  const router = useRouter()

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const [name, setName] = useState('')
  const [sourceModelId, setSourceModelId] = useState('')
  const [description, setDescription] = useState('')
  const [organisation, setOrganisation] = useState<string>('')
  const [visibility, setVisibility] = useState<EntryForm['visibility']>(
    createEntryKind !== EntryKind.UNTRUSTED_MODEL ? EntryVisibility.Public : EntryVisibility.Private,
  )
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles()
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>(
    currentUser ? [{ entity: `${EntityKind.USER}:${currentUser?.dn}`, roles: ['owner'] }] : [],
  )
  const [ungovernedAccess, setUngovernedAccess] = useState(false)
  const [allowTemplating, setAllowTemplating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])

  const isFormValid = useMemo(
    () => name && description && (sourceModelId || createEntryKind !== EntryKind.MIRRORED_MODEL),
    [name, description, createEntryKind, sourceModelId],
  )

  const handleCollaboratorsChange = useCallback((updatedCollaborators: CollaboratorEntry[]) => {
    setCollaborators(updatedCollaborators)
  }, [])

  const entryKindForRedirect = useMemo(() => {
    return createEntryKind === EntryKind.MODEL ||
      createEntryKind === EntryKind.MIRRORED_MODEL ||
      createEntryKind === EntryKind.UNTRUSTED_MODEL
      ? EntryKind.MODEL
      : createEntryKind
  }, [createEntryKind])

  const createEntryKindDescription = useMemo(() => {
    switch (createEntryKind) {
      case EntryKind.MODEL:
        return 'A model repository contains all files, history and information related to a model.'
      case EntryKind.MIRRORED_MODEL:
        return (
          'A mirrored model is a read-only copy of a model from another deployment, imported using a source model ID.'
        )
      case EntryKind.UNTRUSTED_MODEL:
        return (
          'An untrusted model repository contains all files, history and information related to a private model.'
        )
      case EntryKind.DATA_CARD:
        return (
          'A data card tracks and references training data used to generate models, including storage location and accreditation information.'
        )
      default:
        return `Create a new ${EntryKindLabel[createEntryKind]}.`
    }
  }, [createEntryKind])

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')

    const formData: EntryForm = {
      name,
      kind: createEntryKind,
      description,
      organisation,
      visibility,
      collaborators,
      tags,
      settings: {
        ungovernedAccess,
        allowTemplating,
        mirror: {
          sourceModelId,
        },
      },
    }
    const response = await postEntry(formData)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
      setLoading(false)
    } else {
      const data = await response.json()
      router.push(`/${entryKindForRedirect}/${data.model.id}`)
    }
  }

  const privateLabel = useMemo(() => {
    return (
      <Stack
        direction='row'
        spacing={1}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Lock />
        <Stack sx={{ my: 1 }}>
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
          >
            Private
          </Typography>
          <Typography variant='caption'>
            {`Only named individuals will be able to view this ${EntryKindLabel[createEntryKind]}`}
          </Typography>
        </Stack>
      </Stack>
    )
  }, [createEntryKind])

  const publicLabel = useMemo(() => {
    return (
      <Stack
        direction='row'
        spacing={1}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <LockOpen />
        <Stack sx={{ my: 1 }}>
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
          >
            Public
          </Typography>
          <Typography variant='caption'>
            {`Any authorised user will be able to see this ${EntryKindLabel[createEntryKind]}`}
          </Typography>
        </Stack>
      </Stack>
    )
  }, [createEntryKind])

  const allowTemplatingLabel = useMemo(() => {
    return (
      <Stack
        direction='row'
        spacing={1}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <FolderCopy />
        <Stack sx={{ my: 1 }}>
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
          >
            Templating
          </Typography>
          <Typography variant='caption'>
            {`Allow this to be used as a template for another ${EntryKindLabel[createEntryKind]}`}
          </Typography>
        </Stack>
      </Stack>
    )
  }, [createEntryKind])

  const ungovernedAccessLabel = useMemo(() => {
    return (
      <Stack
        direction='row'
        spacing={1}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Gavel />
        <Stack sx={{ my: 1 }}>
          <Typography
            sx={{
              fontWeight: 'bold',
            }}
          >
            Ungoverned Access Requests
          </Typography>
          <Typography variant='caption'>
            {`Allow users to request access without the need for authorisation from ${EntryKindLabel[createEntryKind]} owners`}
          </Typography>
        </Stack>
      </Stack>
    )
  }, [createEntryKind])

  if (isCurrentUserError) {
    return <ErrorWrapper message={isCurrentUserError.info.message} />
  }

  if (isEntryRolesError) {
    return <ErrorWrapper message={isEntryRolesError.info.message} />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Stack spacing={1}>
          <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />} onClick={() => onBackClick()}>
            Back
          </Button>
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant='h6' component='h1' color='primary'>
              {`Create ${toTitleCase(createEntryKind)}`}
            </Typography>
            <FileUpload color='primary' fontSize='large' />
            <Typography>{createEntryKindDescription}</Typography>
          </Stack>
        </Stack>
        <Box component='form' sx={{ mt: 4 }} onSubmit={handleSubmit}>
          <Stack divider={<Divider orientation='vertical' flexItem />} spacing={2}>
            <>
              <Typography component='h2' variant='h6'>
                Overview
              </Typography>
              <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                <Box sx={{ width: '100%' }}>
                  <EntryNameInput autoFocus value={name} kind={createEntryKind} onChange={(value) => setName(value)} />
                </Box>
                <Box sx={{ width: '100%' }}>
                  <EntryOrganisationInput value={organisation} onChange={(value) => setOrganisation(value)} />
                </Box>
                {createEntryKind === EntryKind.MIRRORED_MODEL && (
                  <Box sx={{ width: '100%' }}>
                    <SourceModelInput onChange={(value) => setSourceModelId(value)} value={sourceModelId} />
                  </Box>
                )}
              </Stack>
              <EntryDescriptionInput value={description} onChange={(value) => setDescription(value)} />
            </>
            <Divider />
            <>
              <Typography component='h3' variant='h6'>
                Access control
              </Typography>
              {createEntryKind === EntryKind.UNTRUSTED_MODEL && (
                <Typography color='warning'>Untrusted models can only be private.</Typography>
              )}
              {createEntryKind !== EntryKind.UNTRUSTED_MODEL && (
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
              )}
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
                <Stack spacing={2} divider={<Divider flexItem />}>
                  <Box>
                    <Typography variant='h6' component='h2'>
                      Manage access list
                    </Typography>
                    <Typography variant='caption'>
                      Please note that only{' '}
                      <Link href='/docs/getting-started/core-concepts#system-roles' target='_blank'>
                        system roles
                      </Link>{' '}
                      can be added at this stage, and review roles should be added once a schema has been selected.
                    </Typography>
                    <Box sx={{ my: 1 }}>
                      {isEntryRolesLoading ? (
                        <Loading />
                      ) : (
                        <EntryAccessInput
                          initialUsers={collaborators}
                          onChange={handleCollaboratorsChange}
                          entryKind={createEntryKind}
                          entryRoles={entryRoles}
                        />
                      )}
                    </Box>
                  </Box>
                  <Stack spacing={2}>
                    <Typography variant='h6' component='h2'>
                      Tags
                    </Typography>
                    <TagSelector
                      onChange={(newTags) => setTags(newTags)}
                      value={tags}
                      label=''
                      id='entry-tag-selector'
                      editable
                    />
                  </Stack>
                  {createEntryKind !== EntryKind.UNTRUSTED_MODEL && (
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
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
            <Box sx={{ textAlign: 'right' }}>
              <Tooltip title={!isFormValid ? 'Please make sure all required fields are filled out' : ''}>
                <span>
                  <Button
                    variant='contained'
                    disabled={!isFormValid}
                    type='submit'
                    data-test='createEntryButton'
                    loading={loading}
                    startIcon={<FileUpload />}
                  >
                    {`Create ${EntryKindLabel[createEntryKind]}`}
                  </Button>
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
