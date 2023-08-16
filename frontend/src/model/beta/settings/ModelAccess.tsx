import ClearIcon from '@mui/icons-material/Clear'
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import { useListUsers } from '../../../../actions/user'
import { User } from '../../../../types/types'
import { Entity, ModelInterface } from '../../../../types/v2/types'
import Loading from '../../../common/Loading'

export default function ModelAccess({ model }: { model: ModelInterface }) {
  const [open, setOpen] = useState(false)
  const [accessList, setAccessList] = useState<Entity[]>(model.entities)
  const { users, isUsersLoading } = useListUsers()

  useEffect(() => {
    if (model) {
      setAccessList(model.entities)
    }
  }, [model, setAccessList])

  function onUserChange(_event: React.SyntheticEvent<Element, Event>, newValue: User | null) {
    if (newValue && accessList.find(({ entity }) => entity === `user:${newValue.id}`) === undefined) {
      const updatedAccessList = accessList
      const newAccess = { entity: `user:${newValue.id}`, roles: ['maintainer'] }
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
                        {isUsersLoading ? <CircularProgress color='inherit' size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <List>
              {accessList &&
                accessList.map((entity) => (
                  <ListItem key={entity.entity}>
                    <EntityItem entity={entity} accessList={accessList} setAccessList={setAccessList} />
                  </ListItem>
                ))}
            </List>
            <Button onClick={updateAccessList}>Save</Button>
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
  entity: Entity
  accessList: Entity[]
  setAccessList: Dispatch<SetStateAction<Entity[]>>
}) {
  const roles = ['consumer', 'contributor', 'owner']

  function onRoleChange(_event: React.SyntheticEvent<Element, Event>, newValues: string[]) {
    const updatedAccessList = accessList
    const index = updatedAccessList.findIndex((access) => access.entity === entity.entity)
    updatedAccessList[index].roles = newValues
    setAccessList(updatedAccessList)
  }

  function removeEntity() {
    setAccessList(accessList.filter((access) => access.entity !== entity.entity))
  }

  return (
    <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={2} sx={{ width: '100%' }}>
      <Typography>{entity.entity}</Typography>
      <Autocomplete
        id='role-selector'
        sx={{ width: '100%' }}
        size='small'
        multiple
        options={roles}
        getOptionLabel={(role) => role}
        onChange={onRoleChange}
        renderInput={(params) => <TextField {...params} label='Select roles' />}
      />
      <IconButton onClick={removeEntity} aria-label='delete' size='large'>
        <ClearIcon color='secondary' fontSize='inherit' />
      </IconButton>
    </Stack>
  )
}
