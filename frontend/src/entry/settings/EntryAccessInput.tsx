import { Autocomplete, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material'
import { useListUsers } from 'actions/user'
import { debounce } from 'lodash-es'
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'
import EntityItem from 'src/entry/settings/EntityItem'
import ManualEntityInput from 'src/entry/settings/ManualEntityInput'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, EntityKind, EntityObject, EntryKindKeys, Role } from 'types/types'
import { toSentenceCase } from 'utils/stringUtils'

type EntryAccessInputProps = {
  value: CollaboratorEntry[]
  onUpdate: (list: CollaboratorEntry[]) => void
  entryKind: EntryKindKeys
  entryRoles: Role[]
} & (
  | {
      isReadOnly: boolean
      requiredRolesText: string
    }
  | {
      isReadOnly?: never
      requiredRolesText?: never
    }
)

export default function EntryAccessInput({ value, onUpdate, entryKind, entryRoles }: EntryAccessInputProps) {
  const [open, setOpen] = useState(false)
  const [accessList, setAccessList] = useState<CollaboratorEntry[]>(value)
  const [userListQuery, setUserListQuery] = useState('')
  const [manualEntityEntryErrorMessage, setManualEntityEntryErrorMessage] = useState('')

  const { users, isUsersLoading, isUsersError } = useListUsers(userListQuery)

  const accessListEntities = useMemo(
    () =>
      accessList.map((entity) => (
        <EntityItem
          key={entity.entity}
          entity={entity}
          accessList={accessList}
          onAccessListChange={setAccessList}
          entryRoles={entryRoles}
          entryKind={entryKind}
        />
      )),
    [accessList, entryKind, entryRoles],
  )

  useEffect(() => {
    if (value) {
      setAccessList(value)
    }
  }, [value])

  useEffect(() => {
    onUpdate(accessList)
  }, [accessList, onUpdate])

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

  const handleNewManualEntityEntry = useCallback(
    (manualEntityName: string) => {
      setManualEntityEntryErrorMessage('')
      if (accessList.find((collaborator) => collaborator.entity === `${EntityKind.USER}:${manualEntityName}`)) {
        setManualEntityEntryErrorMessage('User has already been added below.')
      } else {
        setAccessList([...accessList, { entity: `${EntityKind.USER}:${manualEntityName}`, roles: [] }])
      }
    },
    [accessList],
  )

  const debounceOnInputChange = debounce((event: SyntheticEvent<Element, Event>, value: string) => {
    handleInputChange(event, value)
  }, 500)

  const noOptionsText = useMemo(() => {
    if (userListQuery.length < 3) return 'Please enter at least three characters'
    if (isUsersError?.status === 413) return 'Too many results, please refine your search'
    return 'No options'
  }, [userListQuery, isUsersError])

  if (isUsersError && isUsersError.status !== 413) {
    return <MessageAlert message={isUsersError.info.message} severity='error' />
  }

  return (
    <Stack spacing={2}>
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
            label={`Add a user or group to the ${toSentenceCase(entryKind)} access list`}
          />
        )}
      />
      <ManualEntityInput
        onAddEntityManually={handleNewManualEntityEntry}
        errorMessage={manualEntityEntryErrorMessage}
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
    </Stack>
  )
}
