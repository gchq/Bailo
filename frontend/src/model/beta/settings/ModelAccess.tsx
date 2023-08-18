import ClearIcon from '@mui/icons-material/Clear'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import _ from 'lodash-es'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { useListUsers } from '../../../../actions/user'
import { User } from '../../../../types/types'
import { CollaboratorEntry, ModelInterface } from '../../../../types/v2/types'
import Loading from '../../../common/Loading'

export default function ModelAccess({ model }: { model: ModelInterface }) {
  const [open, setOpen] = useState(false)
  const [accessList, setAccessList] = useState<CollaboratorEntry[]>(model.collaborators)
  const { users, isUsersLoading } = useListUsers()

  useEffect(() => {
    if (model) {
      setAccessList(model.collaborators)
    }
  }, [model, setAccessList])

  function onUserChange(_event: React.SyntheticEvent<Element, Event>, newValue: User | null) {
    if (
      newValue &&
      accessList.find(({ entity }) => entity === `user:${newValue.id}`) === undefined &&
      newValue &&
      accessList.find(({ entity }) => entity === `group:${newValue.id}`) === undefined
    ) {
      const updatedAccessList = accessList
      const newAccess = { entity: `user:${newValue.id}`, roles: ['consumer'] }
      updatedAccessList.push(newAccess)
      setAccessList(accessList)
    }
  }

  function updateAccessList() {
    console.log(accessList)
  }

  return (
    <>
      {isUsersLoading && <Loading />}
      {users && (
        <Box sx={{ width: '750px' }}>
          <Stack spacing={2}>
            <Typography variant='h6' component='h2'>
              Manage model access
            </Typography>
            <Autocomplete
              open={open}
              onOpen={() => {
                setOpen(true)
              }}
              onClose={() => {
                setOpen(false)
              }}
              // we might get a string or an object back
              isOptionEqualToValue={(option: User, value: User) => option.id === value.id}
              onChange={onUserChange}
              getOptionLabel={(option) => option.id}
              options={users || []}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Add a user or group to the model access list'
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isUsersLoading ? <Loading /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Box
              sx={{
                overflowY: 'auto',
                maxHeight: '400px',
                border: 'solid 1px',
                padding: '20px',
                borderColor: '#e0e0e0',
                borderRadius: 1,
              }}
            >
              <List disablePadding>
                {accessList &&
                  accessList.map((entity) => (
                    <ListItem key={entity.entity}>
                      <EntityItem entity={entity} accessList={accessList} setAccessList={setAccessList} />
                    </ListItem>
                  ))}
              </List>
            </Box>
            <Button variant='outlined' aria-label='Save access list button' onClick={updateAccessList}>
              Save
            </Button>
          </Stack>
        </Box>
      )}
    </>
  )
}

function EntityItem({
  entity,
  accessList,
  setAccessList,
}: {
  entity: CollaboratorEntry
  accessList: CollaboratorEntry[]
  setAccessList: Dispatch<SetStateAction<CollaboratorEntry[]>>
}) {
  const roles = ['consumer', 'contributor', 'owner']
  const fixedOptions = ['consumer']

  function onRoleChange(_event: React.SyntheticEvent<Element, Event>, newValues: string[]) {
    const updatedAccessList = _.cloneDeep(accessList)
    const index = updatedAccessList.findIndex((access) => access.entity === entity.entity)
    updatedAccessList[index].roles = [
      ...fixedOptions,
      ...newValues.filter((option) => fixedOptions.indexOf(option) === -1),
    ]
    setAccessList(updatedAccessList)
  }

  function removeEntity() {
    setAccessList(accessList.filter((access) => access.entity !== entity.entity))
  }

  function rowIcon() {
    return entity.entity.startsWith('user:') ? <PersonIcon color='primary' /> : <GroupsIcon color='secondary' />
  }

  return (
    <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={2} sx={{ width: '100%' }}>
      <>{rowIcon()}</>
      <Typography>{entity.entity.replace('user:', '').replace('group:', '')}</Typography>
      <Autocomplete
        id='role-selector'
        sx={{ width: '100%' }}
        size='small'
        multiple
        aria-label={`role selector input for entity ${entity.entity}`}
        value={entity.roles}
        options={roles}
        getOptionLabel={(role) => role}
        onChange={onRoleChange}
        renderInput={(params) => <TextField {...params} label='Select roles' />}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            // eslint-disable-next-line react/jsx-key
            <Chip label={option} {...getTagProps({ index })} disabled={fixedOptions.indexOf(option) !== -1} />
          ))
        }
      />
      <IconButton onClick={removeEntity} aria-label={`remove user ${entity.entity} from model access list button`}>
        <ClearIcon color='secondary' fontSize='inherit' />
      </IconButton>
    </Stack>
  )
}
