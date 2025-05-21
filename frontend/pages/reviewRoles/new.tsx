import { ExpandMore, PersonAdd } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Container,
  FormControlLabel,
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
import { ChangeEvent, useState } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import EntityIcon from 'src/entry/EntityIcon'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryAccessInput from 'src/entry/settings/EntryAccessInput'
import { CollaboratorEntry, EntryKind } from 'types/types'

type CollaboratorRoleType = 'None' | 'Contributor' | 'Consumer' | 'Owner'

type ReviewRolesFormData = {
  id: string
  name: string
  shortName: string
  description: string
  defaultEntities?: CollaboratorEntry[]
  lockEntities: boolean
  collaboratorRole?: CollaboratorRoleType
} //To be used later

export default function ReviewRolesForm() {
  const [formData, setFormData] = useState<ReviewRolesFormData>({
    id: '',
    name: '',
    shortName: '',
    description: '',
    collaboratorRole: 'None',
    defaultEntities: [],
    lockEntities: false,
  })

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData) => ({ ...prevFormData, name: event.target.value as string }))
  }

  const handleShortNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData) => ({ ...prevFormData, shortName: event.target.value as string }))
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData((prevFormData) => ({ ...prevFormData, description: event.target.value as string }))
  }

  const handleCollaboratorRoleChange = (event: SelectChangeEvent) => {
    setFormData((prevFormData) => ({ ...prevFormData, collaboratorRole: event.target.value as CollaboratorRoleType }))
  }

  const handleDefaultEntitiesChange = (newValue: Array<CollaboratorEntry>) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      defaultEntities: newValue.map((collaborator) => collaborator),
    }))
  }

  return (
    <Container>
      <Paper sx={{ p: 4, mb: 4 }}>
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
                autoFocus
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
              autoFocus
              size='small'
              id='role-description-input'
            />
          </LabelledInput>
          <LabelledInput required fullWidth label='Collaborator Role' htmlFor='role-collaborator-input'>
            <Select value={formData.collaboratorRole} onChange={handleCollaboratorRoleChange}>
              <MenuItem value='None'>None</MenuItem>
              <MenuItem value='Owner'>Owner</MenuItem>
              <MenuItem value='Contributor'>Contributor</MenuItem>
              <MenuItem value='Consumer'>Consumer</MenuItem>
            </Select>
          </LabelledInput>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
              <Typography fontWeight='bold'>Default collaborators</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mt: 1 }}>
                <EntryAccessInput
                  value={formData.defaultEntities!}
                  entryRoles={[{ id: formData.shortName, name: formData.name }]}
                  onChange={handleDefaultEntitiesChange}
                  entryKind={EntryKind.MODEL}
                  hideActionsTable
                />
                <Stack direction={{ sm: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
                  {formData.defaultEntities && <Typography>Default Collaborators: </Typography>}
                  {formData.defaultEntities &&
                    formData.defaultEntities.map((defaultEntity) => (
                      <Stack key={defaultEntity.entity} direction='row' alignItems='center' spacing={1}>
                        <EntityIcon entryCollaborator={defaultEntity} />
                        <EntityNameDisplay entryCollaborator={defaultEntity} />
                        <Tooltip title='Remove user'>
                          <IconButton
                            onClick={() =>
                              setFormData((prevFormData) => ({
                                ...prevFormData,
                                defaultEntities: formData.defaultEntities!.filter(
                                  (entity) => entity.entity !== defaultEntity.entity,
                                ),
                              }))
                            }
                          >
                            <ClearIcon color='secondary' fontSize='inherit' />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                </Stack>
              </Box>
            </AccordionDetails>
          </Accordion>
          <FormControlLabel
            control={<Checkbox />}
            label='Lock ability to assign entities to this role after creation'
          />
        </Stack>
        <Box display='flex'>
          <Box ml='auto'>
            <LoadingButton
              variant='contained'
              color='primary'
              disabled={!(formData.name && formData.shortName && formData.description && formData.collaboratorRole)}
            >
              Create Role
            </LoadingButton>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}
