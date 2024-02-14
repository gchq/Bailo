import { LoadingButton } from '@mui/lab'
import {
  Autocomplete,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { debounce } from 'lodash-es'
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { patchModel, useGetModel } from '../../../actions/model'
import { useListUsers } from '../../../actions/user'
import { CollaboratorEntry, ModelInterface } from '../../../types/interfaces'
import { EntityObject } from '../../../types/types'
import { getErrorMessage } from '../../../utils/fetcher'
import useNotification from '../../hooks/useNotification'
import MessageAlert from '../../MessageAlert'
import EntityItem from './EntityItem'

type ModelAccessProps = {
  model: ModelInterface
}

export default function ModelAccess({ model }: ModelAccessProps) {
  const [open, setOpen] = useState(false)
  const [accessList, setAccessList] = useState<CollaboratorEntry[]>(model.collaborators)
  const [userListQuery, setUserListQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { users, isUsersLoading, isUsersError } = useListUsers(userListQuery)
  const { isModelError, mutateModel } = useGetModel(model.id)
  const sendNotification = useNotification()

  const accessListEntities = useMemo(
    () =>
      accessList.map((entity) => (
        <EntityItem
          key={entity.entity}
          entity={entity}
          accessList={accessList}
          onAccessListChange={setAccessList}
          model={model}
        />
      )),
    [accessList, model],
  )

  useEffect(() => {
    if (model) {
      setAccessList(model.collaborators)
    }
  }, [model])

  const onUserChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValue: EntityObject | null) => {
      if (newValue && !accessList.find(({ entity }) => entity === `${newValue.kind}:${newValue.id}`)) {
        const updatedAccessList = [...accessList]
        const newAccess = { entity: `${newValue.kind}:${newValue.id}`, roles: [] }
        updatedAccessList.push(newAccess)
        setAccessList(updatedAccessList)
      }
    },
    [accessList],
  )

  const handleInputChange = useCallback((_event: SyntheticEvent<Element, Event>, value: string) => {
    setUserListQuery(value)
  }, [])

  const debounceOnInputChange = debounce((event: SyntheticEvent<Element, Event>, value: string) => {
    handleInputChange(event, value)
  }, 500)

  async function updateAccessList() {
    setLoading(true)
    const res = await patchModel(model.id, { collaborators: accessList })
    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      sendNotification({
        variant: 'success',
        msg: 'Model access list updated',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
      mutateModel()
    }
    setLoading(false)
  }

  const noOptionsText = useMemo(() => {
    if (userListQuery.length < 3) return 'Please enter at least three characters'
    if (isUsersError?.status === 413) return 'Too many results, please refine your search'
    return 'No options'
  }, [userListQuery, isUsersError])

  if (isUsersError && isUsersError.status !== 413) {
    return <MessageAlert message={isUsersError.info.message} severity='error' />
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6' component='h2'>
        Manage model access
      </Typography>
      <Autocomplete
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        size='small'
        noOptionsText={noOptionsText}
        onInputChange={debounceOnInputChange}
        groupBy={(option) => option.kind}
        getOptionLabel={(option) => option.id}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        onChange={onUserChange}
        options={users}
        filterOptions={(options) =>
          options.filter(
            (option) => !accessList.find((collaborator) => collaborator.entity === `${option.kind}:${option.id}`),
          )
        }
        loading={isUsersLoading && userListQuery.length >= 3}
        renderInput={(params) => <TextField {...params} label='Add a user or group to the model access list' />}
      />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Entity</TableCell>
            <TableCell>Roles</TableCell>
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{accessListEntities}</TableBody>
      </Table>
      <LoadingButton variant='contained' aria-label='Save access list' onClick={updateAccessList} loading={loading}>
        Save
      </LoadingButton>
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
}
