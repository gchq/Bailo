import { ExpandMore, PersonAdd } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { ClearIcon } from '@mui/x-date-pickers'
import { useGetModelRoles } from 'actions/model'
import { postReviewRole } from 'actions/reviewRoles'
import { useRouter } from 'next/router'
import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EntityIcon from 'src/entry/EntityIcon'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryAccessInput from 'src/entry/settings/EntryAccessInput'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, CollaboratorRoleType, EntryKind, ReviewRolesFormData, RoleKind } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

export default function ReviewRolesForm() {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ReviewRolesFormData>({
    name: '',
    shortName: '',
    kind: RoleKind.REVIEW,
    description: '',
    defaultEntities: [],
    lockEntities: false,
  })

  const [defaultEntitiesEntry, setDefaultEntities] = useState<Array<CollaboratorEntry>>([])
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles()

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData) => ({ ...prevFormData, name: event.target.value as string }))
  }

  const handleShortNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData) => ({ ...prevFormData, shortName: event.target.value as string }))
    setFormData((prevFormData) => ({ ...prevFormData, id: event.target.value.toLowerCase() as string }))
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData) => ({ ...prevFormData, description: event.target.value as string }))
  }

  const handleCollaboratorRoleChange = (event: SelectChangeEvent) => {
    if (event.target.value === '') {
      delete formData.collaboratorRole
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        collaboratorRole: event.target.value.toLowerCase() as CollaboratorRoleType,
      }))
    }
  }

  const handleDefaultEntitiesChange = useMemo(() => {
    return (newValue: Array<CollaboratorEntry>) => {
      setDefaultEntities(newValue)
    }
  }, [])

  const displayDefaultEntitiesList = useMemo(() => {
    return (
      defaultEntitiesEntry &&
      defaultEntitiesEntry.map((defaultEntity) => (
        <Stack key={defaultEntity.entity} direction='row' alignItems='center' spacing={1}>
          <EntityIcon entryCollaborator={defaultEntity} />
          <EntityNameDisplay entryCollaborator={defaultEntity} />
          <Tooltip title='Remove user'>
            <IconButton
              onClick={() =>
                setDefaultEntities(defaultEntitiesEntry.filter((entity) => entity.entity !== defaultEntity.entity))
              }
            >
              <ClearIcon color='secondary' fontSize='inherit' />
            </IconButton>
          </Tooltip>
        </Stack>
      ))
    )
  }, [defaultEntitiesEntry])

  const displayEntryAccessInput = useMemo(() => {
    return (
      <EntryAccessInput
        value={defaultEntitiesEntry}
        onChange={handleDefaultEntitiesChange}
        entryKind={EntryKind.MODEL}
      />
    )
  }, [defaultEntitiesEntry, handleDefaultEntitiesChange])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)

    const res = await postReviewRole({
      ...formData,
      defaultEntities: defaultEntitiesEntry.map((entity) => entity.entity),
    })

    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      router.push(`/reviewRoles/view`)
    }

    setLoading(false)
  }

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} />
  }

  if (isModelRolesLoading) {
    return <Loading />
  }

  return (
    <>
      <Title text='Create new Review Role' />
      <Container>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Box component='form' onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <Stack alignItems='center' justifyContent='center' spacing={2} sx={{ mb: 4 }}>
                <Typography variant='h6' component='h1'>
                  Create new Role
                </Typography>
                <PersonAdd color='primary' fontSize='large' />
              </Stack>
              <Stack spacing={2} direction='row'>
                <LabelledInput required fullWidth label='Name' htmlFor='role-name-input'>
                  <TextField
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    size='small'
                    fullWidth
                    autoFocus
                    id='role-name-input'
                  />
                </LabelledInput>
                <LabelledInput required fullWidth label='Short name' htmlFor='role-shortname-input'>
                  <TextField
                    required
                    fullWidth
                    value={formData.shortName}
                    onChange={handleShortNameChange}
                    size='small'
                    id='role-shortname-input'
                  />
                </LabelledInput>
              </Stack>
              <LabelledInput required fullWidth label='Description' htmlFor='role-description-input'>
                <TextField
                  required
                  fullWidth
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  size='small'
                  id='role-description-input'
                />
              </LabelledInput>
              <FormControl size='small'>
                <LabelledInput fullWidth label='System Role' htmlFor='role-collaborator-input'>
                  <Select value={formData.collaboratorRole} onChange={handleCollaboratorRoleChange}>
                    <MenuItem value=''>
                      <em>None</em>
                    </MenuItem>
                    {modelRoles.map((role) => (
                      <MenuItem key={role.shortName} value={role.shortName}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </LabelledInput>
              </FormControl>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
                  <Typography fontWeight='bold'>Default collaborators</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mt: 1 }}>
                    {displayEntryAccessInput}
                    <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
                      {formData.defaultEntities && <Typography>Default Collaborators: </Typography>}
                      {displayDefaultEntitiesList}
                    </Stack>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Stack>
            <Box display='flex'>
              <Box ml='auto'>
                <Button
                  loading={loading}
                  type='submit'
                  variant='contained'
                  color='primary'
                  disabled={!(formData.name && formData.shortName && formData.description)}
                >
                  Create Role
                </Button>
                <MessageAlert message={errorMessage} severity='error' />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  )
}
