import ClearIcon from '@mui/icons-material/Clear'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import {
  Autocomplete,
  Chip,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useGetModelRoles } from 'actions/model'
import _ from 'lodash-es'
import { SyntheticEvent, useMemo } from 'react'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, EntityKind, EntryInterface } from 'types/types'
import { toSentenceCase } from 'utils/stringUtils'

type EntityItemProps = {
  entity: CollaboratorEntry
  accessList: CollaboratorEntry[]
  onAccessListChange: (value: CollaboratorEntry[]) => void
  entry: EntryInterface
}

export default function EntityItem({ entity, accessList, onAccessListChange, entry }: EntityItemProps) {
  const {
    modelRoles: entryRoles,
    isModelRolesLoading: isEntryRolesLoading,
    isModelRolesError: isEntryRolesError,
  } = useGetModelRoles(entry.id)

  const entryRoleOptions = useMemo(() => entryRoles.map((role) => role.id), [entryRoles])

  function onRoleChange(_event: SyntheticEvent<Element, Event>, newValues: string[]) {
    const updatedAccessList = _.cloneDeep(accessList)
    const index = updatedAccessList.findIndex((access) => access.entity === entity.entity)
    updatedAccessList[index].roles = newValues
    onAccessListChange(updatedAccessList)
  }

  function removeEntity() {
    onAccessListChange(accessList.filter((access) => access.entity !== entity.entity))
  }

  function getRole(roleId: string) {
    const role = entryRoles.find((role) => role.id === roleId)
    if (!role) return { id: roleId, name: 'Unknown Role' }

    return role
  }

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} severity='error' />
  }

  return (
    <TableRow>
      <TableCell>
        <Stack direction='row' alignItems='center' spacing={1}>
          <EntityIcon entity={entity} />
          <EntityNameDisplay entity={entity} />
        </Stack>
      </TableCell>
      <TableCell>
        {isEntryRolesLoading && <Loading />}
        {!isEntryRolesLoading && entryRoles.length > 0 && (
          <Autocomplete
            size='small'
            multiple
            aria-label={`role selector input for entity ${entity.entity}`}
            value={entity.roles}
            data-test='accessListAutocomplete'
            options={entryRoleOptions}
            getOptionLabel={(role) => getRole(role).name}
            onChange={onRoleChange}
            renderInput={(params) => <TextField {...params} label='Select roles' />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={getRole(option).name} {...getTagProps({ index })} key={option} />
              ))
            }
          />
        )}
      </TableCell>
      <TableCell align='right'>
        <Tooltip title='Remove user' arrow>
          <IconButton
            onClick={removeEntity}
            aria-label={`Remove user ${entity.entity} from ${toSentenceCase(entry.kind)} access list`}
            data-test='accessListRemoveUser'
          >
            <ClearIcon color='secondary' fontSize='inherit' />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}

type EntityIconProps = {
  entity: CollaboratorEntry
}

function EntityIcon({ entity }: EntityIconProps) {
  const isUser = useMemo(() => entity.entity.startsWith('user:'), [entity])
  return isUser ? <PersonIcon color='primary' /> : <GroupsIcon color='secondary' />
}

type EntityNameDisplayProps = {
  entity: CollaboratorEntry
}

function EntityNameDisplay({ entity }: EntityNameDisplayProps) {
  const [entityKind, entityName] = useMemo(() => entity.entity.split(':'), [entity])
  return entityKind === EntityKind.USER || entityKind === EntityKind.GROUP ? (
    <UserDisplay dn={entityName} />
  ) : (
    <Typography fontWeight='bold'>{entityName}</Typography>
  )
}
