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
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useGetEntryRoles } from 'actions/entry'
import { ChangeEvent, ReactElement, useCallback, useMemo, useState } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import Loading from 'src/common/Loading'
import EntryAccessInput from 'src/entry/settings/EntryAccessInput'
import MessageAlert from 'src/MessageAlert'
import { EntryKind, SystemRoleKeys } from 'types/types'

type ReviewRoleFormMinimal = {
  shortName: string
  name: string
  systemRole?: SystemRoleKeys
  defaultEntities?: Array<string>
  description?: string
}

type ReviewRoleFormContainerProps<T extends ReviewRoleFormMinimal> = {
  providedData: boolean
  formData: T
  handleCancel: () => void
  headingComponent: ReactElement
  handleSubmit: (event: ChangeEvent, form: T) => void
  loading: boolean
  errorMessage: string
}

export default function ReviewRoleFormContainer<T extends ReviewRoleFormMinimal>({
  providedData = false,
  formData,
  handleCancel,
  headingComponent,
  handleSubmit,
  loading = false,
  errorMessage = '',
}: ReviewRoleFormContainerProps<T>) {
  const [draftFormData, setDraftFormData] = useState<T>(formData)
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles()

  const handleChange = <K extends keyof T>(field: K, value: T[K]) => {
    setDraftFormData((prevFormData: T) => ({ ...prevFormData, [field]: value }))
  }

  const handleCollaboratorsChange = useCallback(
    (updatedCollaborators: string[]) => {
      setDraftFormData((prevFormData) => ({ ...prevFormData, defaultEntities: updatedCollaborators }))
    },
    [setDraftFormData],
  )

  const displayEntryAccessInput = useMemo(() => {
    return (
      <EntryAccessInput
        initialUsers={draftFormData.defaultEntities ?? []}
        onChange={handleCollaboratorsChange}
        entryKind={EntryKind.MODEL}
      />
    )
  }, [draftFormData.defaultEntities, handleCollaboratorsChange])

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} />
  }

  if (isEntryRolesLoading) {
    return <Loading />
  }

  return (
    <Container>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box component='form' onSubmit={(e) => handleSubmit(e, draftFormData)}>
          {headingComponent}
          <Stack spacing={2}>
            <Stack spacing={2} direction='row'>
              <LabelledInput required fullWidth label='Name' htmlFor='role-name-input'>
                <TextField
                  required
                  value={draftFormData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
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
                  value={draftFormData.shortName}
                  onChange={(e) => handleChange('shortName', e.target.value)}
                  size='small'
                  id='role-shortname-input'
                />
              </LabelledInput>
            </Stack>
            <LabelledInput fullWidth label='Description' htmlFor='role-description-input'>
              <TextField
                fullWidth
                value={draftFormData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                size='small'
                id='role-description-input'
              />
            </LabelledInput>
            <FormControl size='small'>
              <LabelledInput fullWidth label='System Role' htmlFor='role-system-input'>
                <Select value={draftFormData.systemRole} onChange={(e) => handleChange('systemRole', e.target.value)}>
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
                <Button loading={loading} type='button' variant='outlined' color='primary' onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  loading={loading}
                  type='submit'
                  variant='contained'
                  color='primary'
                  disabled={!(draftFormData.name && draftFormData.shortName)}
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
