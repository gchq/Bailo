import { Autocomplete, Box, CircularProgress, Divider, List, ListItem, TextField } from '@mui/material'
import { useState } from 'react'

import { useListUsers } from '../../../../actions/user'
import { Entity, ModelInterface, User } from '../../../../types/types'
import Loading from '../../../common/Loading'

export default function ModelAccess({ model }: { model: ModelInterface }) {
  const [open, setOpen] = useState(false)
  const [accessList, setAccessList] = useState<Entity[]>(model.owners)
  const { users, isUsersLoading } = useListUsers()

  return (
    <>
      {isUsersLoading && <Loading />}
      {users && (
        <Box>
          <Autocomplete
            multiple
            open={open}
            onOpen={() => {
              setOpen(true)
            }}
            onClose={() => {
              setOpen(false)
            }}
            // we might get a string or an object back
            isOptionEqualToValue={(option: User, value: User) => option.id === value.id}
            getOptionLabel={(option) => option.id}
            options={users || []}
            renderInput={(params) => (
              <TextField
                {...params}
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
          <Divider flexItem />
          <List>{accessList && accessList.map((user) => <ListItem key={user.id}>{user.id}</ListItem>)}</List>
        </Box>
      )}
    </>
  )
}
