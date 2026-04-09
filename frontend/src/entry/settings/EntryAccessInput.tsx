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
import { useListEntities } from 'actions/user'
import { debounce } from 'lodash-es'
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'
import EntityItem from 'src/entry/settings/EntityItem'
import ManualEntityInput from 'src/entry/settings/ManualEntityInput'
import { CollaboratorEntry, EntityKind, EntityObject, EntryKindKeys, EntryRole } from 'types/types'
import { fromEntity } from 'utils/entityUtils'
import { toSentenceCase } from 'utils/stringUtils'

type EntryAccessInputProps = {
  entryKind: EntryKindKeys
} & (
  | {
      initialUsers: CollaboratorEntry[]
      onChange: (users: CollaboratorEntry[]) => void
      entryRoles: EntryRole[]
    }
  | {
      initialUsers: string[]
      onChange: (users: string[]) => void
      entryRoles?: never
    }
)

export default function EntryAccessInput({ initialUsers, onChange, entryKind, entryRoles }: EntryAccessInputProps) {
  const [open, setOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorEntry[]>(() => {
    if (entryRoles) {
      return initialUsers
    } else {
      return initialUsers.map((entity) => ({ entity, roles: [] }))
    }
  })
  const [userListQuery, setUserListQuery] = useState('')
  const [manualEntityInputErrorMessage, setManualEntityInputErrorMessage] = useState('')

  const { users, isUsersLoading, isUsersError } = useListEntities(userListQuery)

  const collaboratorList = useMemo(
    () =>
      collaborators.map((entity) => (
        <EntityItem
          key={entity.entity}
          entity={entity}
          collaborators={collaborators}
          onCollaboratorsChange={setCollaborators}
          entryRoles={entryRoles ?? []}
          entryKind={entryKind}
        />
      )),
    [collaborators, entryKind, entryRoles],
  )

  useEffect(() => {
    if (entryRoles) {
      onChange(collaborators)
    } else {
      onChange(collaborators.map((collaborator) => collaborator.entity))
    }
  }, [collaborators, entryRoles, onChange])

  const onUserChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, updatedMutiselectList: EntityObject[] | null) => {
      if (updatedMutiselectList) {
        const newValues = updatedMutiselectList.filter(
          (newValue) => !collaborators.find(({ entity }) => entity === `${newValue.kind}:${newValue.id}`),
        )
        const updatedCollaborators = [
          ...collaborators,
          ...newValues.map((newValue) => ({ entity: `${newValue.kind}:${newValue.id}`, roles: [] })),
        ]
        setCollaborators(updatedCollaborators)
      }
    },
    [collaborators],
  )

  const collaboratorEntityObjects = useMemo(
    () => collaborators.map((collaborator) => fromEntity(collaborator.entity)),
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
    if (userListQuery.length < 3) {
      return 'Please enter at least three characters'
    }
    if (isUsersError?.status === 413) {
      return 'Too many results, please refine your search'
    }
    return 'No options'
  }, [userListQuery, isUsersError])

  return (
    <Stack spacing={2}>
      {isUsersError && isUsersError.status !== 413 && (
        <Typography variant='caption' color='error'>
          {isUsersError.info.message}
        </Typography>
      )}
      <Autocomplete
        multiple
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        size='small'
        noOptionsText={noOptionsText}
        onInputChange={debounceOnInputChange}
        value={collaboratorEntityObjects}
        renderValue={() => null}
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
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Entity</TableCell>
            {entryRoles && <TableCell>Roles</TableCell>}
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{collaboratorList}</TableBody>
      </Table>
    </Stack>
  )
}
