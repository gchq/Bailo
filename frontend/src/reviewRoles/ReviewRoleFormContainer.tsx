import { ExpandMore } from '@mui/icons-material'
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
import { postReviewRole, putReviewRole, UpdateReviewRolesParams } from 'actions/reviewRoles'
import router from 'next/router'
import { ChangeEvent, FormEvent, ReactElement, useMemo, useState } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import Loading from 'src/common/Loading'
import EntityIcon from 'src/entry/EntityIcon'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryAccessInput from 'src/entry/settings/EntryAccessInput'
import MessageAlert from 'src/MessageAlert'
import { KeyedMutator } from 'swr/dist/_internal/types'
import {
  CollaboratorEntry,
  CollaboratorRoleType,
  EntryKind,
  ReviewRoleInterface,
  ReviewRolesFormData,
} from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type ReviewRolesFormDataUnion = UpdateReviewRolesParams | ReviewRolesFormData

type ReviewRoleFormContainerProps = {
  providedData: boolean
  formData?: ReviewRolesFormDataUnion
  setFormData: (prevFormData: any) => void
  setIsEdit?: (state: boolean) => void
  mutateReviewRoles?: KeyedMutator<{
    reviewRoles: ReviewRoleInterface[]
  }>
  headingComponent: ReactElement
}

export default function ReviewRoleFormContainer({
  providedData = false,
  formData = { name: '', shortName: '', description: '', collaboratorRole: 'none', defaultEntities: [] },
  setFormData,
  setIsEdit = () => {},
  mutateReviewRoles,
  headingComponent,
}: ReviewRoleFormContainerProps) {
  const [defaultEntitiesEntry, setDefaultEntities] = useState<Array<CollaboratorEntry>>(
    formData.defaultEntities
      ? formData.defaultEntities.map((defaultEntity) => ({ entity: defaultEntity, roles: [] }))
      : [{ entity: '', roles: [] }],
  )
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles()

  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData: UpdateReviewRolesParams) => ({ ...prevFormData, name: event.target.value as string }))
  }

  const handleShortNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData: UpdateReviewRolesParams) => ({
      ...prevFormData,
      shortName: event.target.value as string,
    }))
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData: UpdateReviewRolesParams) => ({
      ...prevFormData,
      description: event.target.value as string,
    }))
  }

  const handleCollaboratorRoleChange = (event: SelectChangeEvent) => {
    if (event.target.value === '') {
      delete formData.collaboratorRole
    } else {
      setFormData((prevFormData: UpdateReviewRolesParams) => ({
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)

    if (providedData) {
      //Existing data (view.tsx)

      const res = await putReviewRole({
        ...formData,
        defaultEntities: defaultEntitiesEntry.map((entity) => entity.entity),
      } as UpdateReviewRolesParams)

      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
      } else {
        if (mutateReviewRoles) {
          mutateReviewRoles()
        }

        setIsEdit(false)
      }
    } else {
      //New data (new.tsx)

      const res = await postReviewRole({
        ...formData,
        defaultEntities: defaultEntitiesEntry.map((entity) => entity.entity),
      } as ReviewRolesFormData)

      if (!res.ok) {
        setErrorMessage(await getErrorMessage(res))
      } else {
        router.push(`/reviewRoles/view`)
      }
    }

    setLoading(false)
  }

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

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} />
  }

  if (isModelRolesLoading) {
    return <Loading />
  }

  return (
    <Container>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box component='form' onSubmit={handleSubmit}>
          {headingComponent}
          <Stack spacing={2}>
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
                  disabled={providedData}
                  fullWidth
                  value={formData.shortName}
                  onChange={handleShortNameChange}
                  size='small'
                  id='role-shortname-input'
                />
              </LabelledInput>
            </Stack>
            <LabelledInput fullWidth label='Description' htmlFor='role-description-input'>
              <TextField
                fullWidth
                value={formData.description}
                onChange={handleDescriptionChange}
                size='small'
                id='role-description-input'
              />
            </LabelledInput>
            <FormControl size='small'>
              <LabelledInput fullWidth label='Collaborator Role' htmlFor='role-collaborator-input'>
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
              <Stack direction='row' spacing={2}>
                <Button
                  loading={loading}
                  type='button'
                  variant='outlined'
                  color='primary'
                  onClick={() => setIsEdit(false)}
                >
                  Cancel
                </Button>
                <Button
                  loading={loading}
                  type='submit'
                  variant='contained'
                  color='primary'
                  disabled={!(formData.name && formData.shortName && formData.description)}
                >
                  Submit
                </Button>
              </Stack>
              <MessageAlert message={errorMessage} severity='error' />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
