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
import { UpdateReviewRolesParams } from 'actions/reviewRoles'
import { ChangeEvent, Dispatch, FormEvent, ReactElement, SetStateAction, useMemo } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import Loading from 'src/common/Loading'
import EntityIcon from 'src/entry/EntityIcon'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryAccessInput from 'src/entry/settings/EntryAccessInput'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, EntryKind, ReviewRolesFormData, SystemRoleKeys } from 'types/types'

type ReviewRolesFormDataUnion = UpdateReviewRolesParams | ReviewRolesFormData

type ReviewRoleFormContainerProps = {
  providedData: boolean
  formData?: ReviewRolesFormDataUnion
  setFormData: (prevFormData: any) => void
  setIsEdit?: (state: boolean) => void
  headingComponent: ReactElement
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  loading: boolean
  errorMessage: string
  defaultEntitiesEntry: Array<CollaboratorEntry>
  setDefaultEntities: Dispatch<SetStateAction<CollaboratorEntry[]>>
}

export default function ReviewRoleFormContainer({
  providedData = false,
  formData = { name: '', shortName: '', description: '', systemRole: 'none', defaultEntities: [] },
  setFormData,
  setIsEdit = () => {},
  headingComponent,
  handleSubmit,
  loading,
  errorMessage,
  defaultEntitiesEntry,
  setDefaultEntities,
}: ReviewRoleFormContainerProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles()

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

  const handleSystemRoleChange = (event: SelectChangeEvent) => {
    if (event.target.value === '') {
      delete formData.systemRole
    } else {
      setFormData((prevFormData: UpdateReviewRolesParams) => ({
        ...prevFormData,
        systemRole: event.target.value.toLowerCase() as SystemRoleKeys,
      }))
    }
  }

  const handleDefaultEntitiesChange = useMemo(() => {
    return (newValue: Array<CollaboratorEntry>) => {
      setDefaultEntities(newValue)
    }
  }, [setDefaultEntities])

  // const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  //   event.preventDefault()
  //   setErrorMessage('')
  //   setLoading(true)

  //   if (providedData) {
  //     const res = await putReviewRole({
  //       ...formData,
  //       defaultEntities: defaultEntitiesEntry.map((entity) => entity.entity),
  //     } as UpdateReviewRolesParams)

  //     if (!res.ok) {
  //       setErrorMessage(await getErrorMessage(res))
  //     } else {
  //       if (mutateReviewRoles) {
  //         mutateReviewRoles()
  //       }

  //       setIsEdit(false)
  //     }
  //   } else {
  //     const res = await postReviewRole({
  //       ...formData,
  //       defaultEntities: defaultEntitiesEntry.map((entity) => entity.entity),
  //     } as ReviewRolesFormData)

  //     if (!res.ok) {
  //       setErrorMessage(await getErrorMessage(res))
  //     } else {
  //       router.push(`/reviewRoles/view`)
  //     }
  //   }

  //   setLoading(false)
  // }

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
  }, [defaultEntitiesEntry, setDefaultEntities])

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
                <Select value={formData.systemRole} onChange={handleSystemRoleChange}>
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
                  disabled={!(formData.name && formData.shortName)}
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
