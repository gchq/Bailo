import GroupIcon from '@mui/icons-material/Groups'
import UserIcon from '@mui/icons-material/Person'
import { Grid, Stack } from '@mui/material'
import { Fragment, useMemo } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import EntryCardRolesChipSet from 'src/entry/overview/EntryCardRolesChipSet'
import { CollaboratorEntry } from 'types/types'

type EntryCardEntityRoleRowProps = {
  entryCollaborators: CollaboratorEntry[]
}

export default function EntryCardEntityRoleRow({ entryCollaborators }: EntryCardEntityRoleRowProps) {
  return entryCollaborators.map((user) => (
    <Fragment key={user.entity}>
      <Grid item xs={6}>
        <Stack direction='row' alignItems='center' spacing={1}>
          <EntryCollaboratorIcon entity={user} />
          <EntryCollaboratorName entity={user} />
        </Stack>
      </Grid>
      <Grid item xs={6}>
        <EntryCardRolesChipSet entryCollaborator={user} />
      </Grid>
    </Fragment>
  ))
}

type EntryCollaboratorProps = {
  entity: CollaboratorEntry
}

function EntryCollaboratorIcon({ entity }: EntryCollaboratorProps) {
  const isUser = useMemo(() => entity.entity.startsWith('user:'), [entity])
  return isUser ? <UserIcon color='primary' /> : <GroupIcon color='secondary' />
}

function EntryCollaboratorName({ entity }: EntryCollaboratorProps) {
  const entityName = useMemo(() => entity.entity.split('/').pop()!, [entity])
  return (
    <>
      <UserDisplay dn={entityName} />
    </>
  )
}
