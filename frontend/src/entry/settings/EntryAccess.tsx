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
import { patchModel, useGetModel } from 'actions/model'
import { useListUsers } from 'actions/user'
import { debounce } from 'lodash-es'
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'
import HelpDialog from 'src/common/HelpDialog'
import EntryRolesInfo from 'src/entry/model/settings/EntryRolesInfo'
import EntityItem from 'src/entry/settings/EntityItem'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, EntityObject, EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toSentenceCase, toTitleCase } from 'utils/stringUtils'

type EntryAccessProps = {
  entry: EntryInterface
}

export default function EntryAccess({ entry }: EntryAccessProps) {
  const [open, setOpen] = useState(false)
  const [accessList, setAccessList] = useState<CollaboratorEntry[]>(entry.collaborators)
  const [userListQuery, setUserListQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { users, isUsersLoading, isUsersError } = useListUsers(userListQuery)
  const { isModelError: isEntryError, mutateModel: mutateEntry } = useGetModel(entry.id, entry.kind)
  const sendNotification = useNotification()

  const accessListEntities = useMemo(
    () =>
      accessList.map((entity) => (
        <EntityItem
          key={entity.entity}
          entity={entity}
          accessList={accessList}
          onAccessListChange={setAccessList}
          entry={entry}
        />
      )),
    [accessList, entry],
  )

  useEffect(() => {
    if (entry) {
      setAccessList(entry.collaborators)
    }
  }, [entry])

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
    const res = await patchModel(entry.id, { collaborators: accessList })
    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      sendNotification({
        variant: 'success',
        msg: `${toTitleCase(entry.kind)} access list updated`,
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
      mutateEntry()
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

  if (isEntryError) {
    return <MessageAlert message={isEntryError.info.message} severity='error' />
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6' component='h2'>
        {`Manage ${toSentenceCase(entry.kind)} access`}
      </Typography>
      <Autocomplete
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        size='small'
        noOptionsText={noOptionsText}
        onInputChange={debounceOnInputChange}
        groupBy={(option) => option.kind.toUpperCase()}
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
        renderInput={(params) => (
          <TextField
            {...params}
            autoFocus
            label={`Add a user or group to the ${toSentenceCase(entry.kind)} access list`}
          />
        )}
      />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Entity</TableCell>
            <TableCell>
              <Stack direction='row' spacing={1} alignItems='center'>
                <span>Roles</span>
                <HelpDialog dialogTitle='Roles Explained' content={<EntryRolesInfo modelId={entry.id} />} />
              </Stack>
            </TableCell>
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
