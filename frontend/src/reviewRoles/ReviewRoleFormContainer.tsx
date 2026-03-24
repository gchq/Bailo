import { ExpandMore } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useGetEntryRoles } from 'actions/entry'
import { ChangeEvent, Dispatch, FormEvent, ReactElement, SetStateAction, useCallback, useMemo } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import Loading from 'src/common/Loading'
import EntryAccessInput from 'src/entry/settings/EntryAccessInput'
import MessageAlert from 'src/MessageAlert'
import { EntryKind, SystemRoleKeys } from 'types/types'

type ReviewRoleFormMinimal = {
  shortName: string
  name: string
  systemRole: SystemRoleKeys
  defaultEntities?: Array<string>
  description?: string
}

type ReviewRoleFormContainerProps<T extends ReviewRoleFormMinimal> = {
  providedData: boolean
  formData: T
  setFormData: Dispatch<SetStateAction<T>>
  setIsEdit?: (state: boolean) => void
  headingComponent: ReactElement
  //TODO replace
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  loading: boolean
  errorMessage: string
}

export default function ReviewRoleFormContainer<T extends ReviewRoleFormMinimal>({
  providedData = false,
  formData,
  setFormData,
  setIsEdit = () => {},
  headingComponent,
  handleSubmit,
  loading = false,
  errorMessage = '',
}: ReviewRoleFormContainerProps<T>) {
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles()

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData: T) => ({ ...prevFormData, name: event.target.value as string }))
  }

  const handleCollaboratorsChange = useCallback(
    (updatedCollaborators: string[]) => {
      setFormData((prevFormData) => ({ ...prevFormData, defaultEntities: updatedCollaborators }))
    },
    [setFormData],
  )

  const handleShortNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData: T) => ({
      ...prevFormData,
      shortName: event.target.value as string,
    }))
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData: T) => ({
      ...prevFormData,
      description: event.target.value as string,
    }))
  }

  const handleSystemRoleChange = (event: SelectChangeEvent) => {
    setFormData((prevFormData: T) => ({
      ...prevFormData,
      systemRole: event.target.value.toLowerCase() as SystemRoleKeys,
    }))
  }

  const displayEntryAccessInput = useMemo(() => {
    return (
      <EntryAccessInput
        value={formData.defaultEntities ? formData.defaultEntities : []}
        onChange={handleCollaboratorsChange}
        entryKind={EntryKind.MODEL}
      />
    )
  }, [formData.defaultEntities, handleCollaboratorsChange])

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} />
  }

  if (isEntryRolesLoading) {
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
                  {entryRoles.map((role) => (
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
                <Box sx={{ mt: 1 }}>{displayEntryAccessInput}</Box>
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
