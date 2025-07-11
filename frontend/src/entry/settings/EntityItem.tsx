import ClearIcon from '@mui/icons-material/Clear'
import { Autocomplete, Chip, IconButton, Stack, TableCell, TableRow, TextField, Tooltip } from '@mui/material'
import * as _ from 'lodash-es'
import { SyntheticEvent, useMemo } from 'react'
import EntityIcon from 'src/entry/EntityIcon'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import { CollaboratorEntry, SystemRole } from 'types/types'
import { getRoleDisplayName } from 'utils/roles'
import { toSentenceCase } from 'utils/stringUtils'

type EntityItemProps = {
  entity: CollaboratorEntry
  collaborators: CollaboratorEntry[]
  onCollaboratorsChange: (value: CollaboratorEntry[]) => void
  entryKind: string
  entryRoles: SystemRole[]
}

export default function EntityItem({
  entity,
  collaborators,
  onCollaboratorsChange,
  entryKind,
  entryRoles,
}: EntityItemProps) {
  const entryRoleOptions = useMemo(() => entryRoles.map((role) => role.id), [entryRoles])

  function onRoleChange(_event: SyntheticEvent<Element, Event>, newValues: string[]) {
    const updatedAccessList = _.cloneDeep(collaborators)
    const index = updatedAccessList.findIndex((access) => access.entity === entity.entity)
    updatedAccessList[index].roles = newValues
    onCollaboratorsChange(updatedAccessList)
  }

  function removeEntity() {
    onCollaboratorsChange(collaborators.filter((access) => access.entity !== entity.entity))
  }

  return (
    <TableRow>
      <TableCell>
        <Stack direction='row' alignItems='center' spacing={1}>
          <EntityIcon entryCollaborator={entity} />
          <EntityNameDisplay entryCollaborator={entity} />
        </Stack>
      </TableCell>
      <TableCell>
        {entryRoles.length > 0 && (
          <Autocomplete
            multiple
            size='small'
            aria-label={`role selector input for entity ${entity.entity}`}
            value={entity.roles}
            data-test='accessListAutocomplete'
            options={entryRoleOptions}
            getOptionLabel={(role) => getRoleDisplayName(role, entryRoles)}
            onChange={onRoleChange}
            renderInput={(params) => <TextField {...params} label='Select roles' />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={getRoleDisplayName(option, entryRoles)} {...getTagProps({ index })} key={option} />
              ))
            }
          />
        )}
      </TableCell>
      <TableCell align='right'>
        <Tooltip title='Remove user'>
          <IconButton
            aria-label={`Remove user ${entity.entity} from ${toSentenceCase(entryKind)} access list`}
            onClick={removeEntity}
            data-test='accessListRemoveUser'
          >
            <ClearIcon color='secondary' fontSize='inherit' />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}
