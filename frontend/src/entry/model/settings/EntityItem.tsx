import ClearIcon from '@mui/icons-material/Clear'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import { Autocomplete, Chip, IconButton, Stack, TableCell, TableRow, TextField, Tooltip } from '@mui/material'
import { useGetModelRoles } from 'actions/model'
import _ from 'lodash-es'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, EntryInterface } from 'types/types'

type EntityItemProps = {
  entity: CollaboratorEntry
  accessList: CollaboratorEntry[]
  onAccessListChange: (value: CollaboratorEntry[]) => void
  model: EntryInterface
  setRoleError: (value: string) => void
}

export default function EntityItem({ entity, accessList, onAccessListChange, model, setRoleError }: EntityItemProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(model.id)

  const modelRoleOptions = useMemo(() => modelRoles.map((role) => role.id), [modelRoles])
  function onRoleChange(_event: React.SyntheticEvent<Element, Event>, newValues: string[]) {
    const updatedAccessList = _.cloneDeep(accessList)
    const index = updatedAccessList.findIndex((access) => access.entity === entity.entity)
    updatedAccessList[index].roles = newValues
    onAccessListChange(updatedAccessList)
  }

  function removeEntity() {
    onAccessListChange(accessList.filter((access) => access.entity !== entity.entity))
  }

  function getRole(roleId: string) {
    const role = modelRoles.find((role) => role.id === roleId)
    if (!role) return { id: roleId, name: 'Unknown Role' }

    return role
  }

  if (isModelRolesError) {
    setRoleError(isModelRolesError.info.message)
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <TableRow>
      <TableCell>
        <Stack direction='row' alignItems='center' spacing={0.5}>
          <EntityIcon entity={entity} />
          <EntityNameDisplay entity={entity} setRoleError={setRoleError} />
        </Stack>
      </TableCell>
      <TableCell>
        {isModelRolesLoading && <Loading />}
        {!isModelRolesLoading && modelRoles.length > 0 && (
          <Autocomplete
            size='small'
            multiple
            aria-label={`role selector input for entity ${entity.entity}`}
            value={entity.roles}
            data-test='accessListAutocomplete'
            options={modelRoleOptions}
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
            aria-label={`Remove user ${entity.entity} from model access list`}
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
  setRoleError: (value: string) => void
}

function EntityNameDisplay({ entity, setRoleError }: EntityNameDisplayProps) {
  const entityName = useMemo(() => entity.entity.replace('user:', '').replace('group:', ''), [entity])
  return <UserDisplay dn={entityName} setRoleError={setRoleError} />
}
