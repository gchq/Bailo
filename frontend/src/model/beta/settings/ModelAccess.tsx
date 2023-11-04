import {
  Autocomplete,
  Box,
  Button,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import _ from 'lodash-es'
import { useEffect, useState } from 'react'

import { patchModel, useGetModel } from '../../../../actions/model'
import { useListUsers } from '../../../../actions/user'
import { User } from '../../../../types/types'
import { CollaboratorEntry, ModelInterface } from '../../../../types/v2/types'
import { getErrorMessage } from '../../../../utils/fetcher'
import Loading from '../../../common/Loading'
import useNotification from '../../../common/Snackbar'
import MessageAlert from '../../../MessageAlert'
import EntityItem from './EntityItem'

type ModelAccessProps = {
  model: ModelInterface
}

export default function ModelAccess({ model }: ModelAccessProps) {
  const [open, setOpen] = useState(false)
  const [accessList, setAccessList] = useState<CollaboratorEntry[]>(model.collaborators)

  const { users, isUsersLoading, isUsersError } = useListUsers()
  const { mutateModel } = useGetModel(model.id)
  const theme = useTheme()
  const sendNotification = useNotification()

  useEffect(() => {
    if (model) {
      setAccessList(model.collaborators)
    }
  }, [model, setAccessList])

  function onUserChange(_event: React.SyntheticEvent<Element, Event>, newValue: User | null) {
    if (
      newValue &&
      !accessList.find(({ entity }) => entity === `user:${newValue.id}` || entity === `group:${newValue.id}`)
    ) {
      const updatedAccessList = accessList
      const newAccess = { entity: `user:${newValue.id}`, roles: [] }
      updatedAccessList.push(newAccess)
      setAccessList(accessList)
    }
  }

  async function updateAccessList() {
    const res = await patchModel(model.id, { collaborators: accessList })
    if (!res.ok) {
      const error = await getErrorMessage(res)
      return sendNotification({
        variant: 'success',
        msg: error,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
    sendNotification({
      variant: 'success',
      msg: 'Model access list updated',
      anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
    })
    mutateModel()
  }

  if (isUsersError) {
    return <MessageAlert message={isUsersError.info.message} severity='error' />
  }

  return (
    <>
      {isUsersLoading && <Loading />}
      {users && (
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
            options={users}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Add a user or group to the model access list'
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isUsersLoading && <Loading size={20} />}
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
              borderRadius: 1,
              borderColor: theme.palette.primary.main,
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Entity</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accessList.map((entity) => (
                  <EntityItem
                    key={entity.entity}
                    entity={entity}
                    accessList={accessList}
                    onAccessListChange={setAccessList}
                    model={model}
                  />
                ))}
              </TableBody>
            </Table>
          </Box>
          <Divider />
          <div>
            <Button variant='contained' aria-label='Save access list' onClick={updateAccessList}>
              Save
            </Button>
          </div>
        </Stack>
      )}
    </>
  )
}
