import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Box,
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
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { patchModel, useGetModel } from '../../../../actions/model'
import { useListUsers } from '../../../../actions/user'
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
  const [userListQuery, setUserListQuery] = useState('')

  const [loading, setLoading] = useState(false)

  const { users, isUsersLoading, isUsersError } = useListUsers(userListQuery)
  const { mutateModel } = useGetModel(model.id)
  const theme = useTheme()
  const sendNotification = useNotification()

  useEffect(() => {
    if (model) {
      setAccessList(model.collaborators)
    }
  }, [model, setAccessList])

  const entities = useMemo(() => {
    if (!users) return []

    const userGroup = users.find((usrGroup) => usrGroup.kind === 'user')
    if (userGroup) {
      return userGroup.entities
    } else {
      return []
    }
  }, [users])

  const onUserChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValue: string | null) => {
      if (newValue && !accessList.find(({ entity }) => entity === newValue)) {
        const updatedAccessList = accessList
        const newAccess = { entity: newValue, roles: [] }
        updatedAccessList.push(newAccess)
        setAccessList(accessList)
      }
    },
    [accessList],
  )

  const handleInputChange = useCallback((_event: SyntheticEvent<Element, Event>, value: string) => {
    setUserListQuery(value)
  }, [])

  async function updateAccessList() {
    setLoading(true)
    const res = await patchModel(model.id, { collaborators: accessList })
    if (!res.ok) {
      const error = await getErrorMessage(res)
      return sendNotification({
        variant: 'error',
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
    setLoading(false)
  }

  if (isUsersError) {
    return <MessageAlert message={isUsersError.info.message} severity='error' />
  }

  return (
    <>
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
            onInputChange={handleInputChange}
            isOptionEqualToValue={(option: string, value: string) => option === value}
            getOptionLabel={(option) => option.split(':')[1]}
            onChange={onUserChange}
            options={entities}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Add a user or group to the model access list'
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {userListQuery !== '' && isUsersLoading && <Loading size={20} />}
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
            <LoadingButton
              variant='contained'
              aria-label='Save access list'
              onClick={updateAccessList}
              loading={loading}
            >
              Save
            </LoadingButton>
          </div>
        </Stack>
      )}
    </>
  )
}
