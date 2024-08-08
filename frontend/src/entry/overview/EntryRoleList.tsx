import GroupIcon from '@mui/icons-material/Groups'
import UserIcon from '@mui/icons-material/Person'
import { Grid, Stack } from '@mui/material'
import { Fragment, useMemo } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import EntryCardRolesChipSet from 'src/entry/overview/EntryCardRolesChipSet'
import { CollaboratorEntry, EntryInterface } from 'types/types'

type EntryCardRoleDialogProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryCardRoleDialogProps) {
  const rows = useMemo(
    () =>
      entry.collaborators.map((collaborator) => (
        <Fragment key={collaborator.entity}>
          <Grid item xs={6}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <EntryCollaboratorIcon entryCollaborator={collaborator} />
              <EntryCollaboratorName entryCollaborator={collaborator} />
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <EntryCardRolesChipSet entryCollaborator={collaborator} />
          </Grid>
        </Fragment>
      )),
    [entry.collaborators],
  )

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        Entity
      </Grid>
      <Grid item xs={6}>
        Roles
      </Grid>
      {rows}
    </Grid>
  )
}

type EntryCollaboratorProps = {
  entryCollaborator: CollaboratorEntry
}

function EntryCollaboratorIcon({ entryCollaborator }: EntryCollaboratorProps) {
  const isUser = useMemo(() => entryCollaborator.entity.startsWith('user:'), [entryCollaborator])
  return isUser ? <UserIcon color='primary' /> : <GroupIcon color='secondary' />
}

function EntryCollaboratorName({ entryCollaborator }: EntryCollaboratorProps) {
  const entityName = useMemo(() => entryCollaborator.entity.split('/').pop()!, [entryCollaborator])
  return (
    <>
      <UserDisplay dn={entityName} />
    </>
  )
}
