import ClearIcon from '@mui/icons-material/Clear'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import { Autocomplete, Chip, IconButton, Stack, TextField, Typography } from '@mui/material'
import _ from 'lodash-es'
import { Dispatch, SetStateAction } from 'react'

import { CollaboratorEntry } from '../../../../types/v2/types'

type EntityItemProps = {
  entity: CollaboratorEntry
  accessList: CollaboratorEntry[]
  setAccessList: Dispatch<SetStateAction<CollaboratorEntry[]>>
}

export default function EntityItem({ entity, accessList, setAccessList }: EntityItemProps) {
  const roles = ['consumer', 'contributor', 'owner']

  function onRoleChange(_event: React.SyntheticEvent<Element, Event>, newValues: string[]) {
    const updatedAccessList = _.cloneDeep(accessList)
    const index = updatedAccessList.findIndex((access) => access.entity === entity.entity)
    updatedAccessList[index].roles = newValues
    setAccessList(updatedAccessList)
  }

  function removeEntity() {
    setAccessList(accessList.filter((access) => access.entity !== entity.entity))
  }

  return (
    <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={2} sx={{ width: '100%' }}>
      <EntityIcon entity={entity} />
      <Typography>{entity.entity.replace('user:', '').replace('group:', '')}</Typography>
      <Autocomplete
        id='role-selector'
        sx={{ width: '100%' }}
        size='small'
        multiple
        aria-label={`role selector input for entity ${entity.entity}`}
        value={entity.roles}
        data-test='accesslistAutoselect'
        options={roles}
        getOptionLabel={(role) => role}
        onChange={onRoleChange}
        renderInput={(params) => <TextField {...params} label='Select roles' />}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => <Chip label={option} {...getTagProps({ index })} key={option} />)
        }
      />
      <IconButton
        onClick={removeEntity}
        aria-label={`Remove user ${entity.entity} from model access list`}
        data-test='accesslistRemoveUser'
      >
        <ClearIcon color='secondary' fontSize='inherit' />
      </IconButton>
    </Stack>
  )
}

type EntityIconProps = {
  entity: CollaboratorEntry
}

function EntityIcon({ entity }: EntityIconProps) {
  return entity.entity.startsWith('user:') ? <PersonIcon color='primary' /> : <GroupsIcon color='secondary' />
}
