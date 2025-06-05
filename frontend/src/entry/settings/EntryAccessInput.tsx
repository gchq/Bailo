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
  onChange: (value: CollaboratorEntry[]) => void
  entryKind: EntryKindKeys
  hideActionsTable?: boolean
  collaboratorsValue?: CollaboratorEntry[]
  entryRoles?: Role[]
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

export default function EntryAccessInput({
  value,
  onChange,
  entryKind,
  entryRoles,
  hideActionsTable = false,
}: EntryAccessInputProps) {
  const [open, setOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>(value)
  const [userListQuery, setUserListQuery] = useState('')
  const [manualEntityInputErrorMessage, setManualEntityInputErrorMessage] = useState('')

  const { users, isUsersLoading, isUsersError } = useListUsers(userListQuery)

  const collaboratorList = useMemo(
    () =>
      entryRoles &&
      collaborators.map((entity) => (
        <EntityItem
          key={entity.entity}
          entity={entity}
          collaborators={collaborators}
          onCollaboratorsChange={setCollaborators}
          entryRoles={entryRoles}
          entryKind={entryKind}
        />
      )),
    [collaborators, entryKind, entryRoles],
  )

  useEffect(() => {
    if (value) {
      setCollaborators(value)
    }
  }, [value])

  useEffect(() => {
    onChange(collaborators)
  }, [collaborators, onChange])

  const onUserChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValue: EntityObject | null) => {
      if (newValue && !collaborators.find(({ entity }) => entity === `${newValue.kind}:${newValue.id}`)) {
        const updatedCollaborators = [...collaborators]
        const newCollaborator = { entity: `${newValue.kind}:${newValue.id}`, roles: [] }
        updatedCollaborators.push(newCollaborator)
        setCollaborators(updatedCollaborators)
      }
    },
    [collaborators],
  )

  const handleInputChange = useCallback((_event: SyntheticEvent<Element, Event>, value: string) => {
    setUserListQuery(value)
  }, [])

  const handleAddEntityManually = (manualEntityName: string) => {
    setManualEntityInputErrorMessage('')
    if (collaborators.find((collaborator) => collaborator.entity === `${EntityKind.USER}:${manualEntityName}`)) {
      setManualEntityInputErrorMessage('User has already been added below.')
    } else {
      setCollaborators([...collaborators, { entity: `${EntityKind.USER}:${manualEntityName}`, roles: [] }])
    }
  }

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
            (option) => !collaborators.find((collaborator) => collaborator.entity === `${option.kind}:${option.id}`),
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
      <ManualEntityInput onAddEntityManually={handleAddEntityManually} errorMessage={manualEntityInputErrorMessage} />
      {!hideActionsTable && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Entity</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{collaboratorList}</TableBody>
        </Table>
      )}
    </Stack>
  )
}
