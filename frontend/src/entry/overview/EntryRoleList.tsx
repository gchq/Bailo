import GroupIcon from '@mui/icons-material/Groups'
import UserIcon from '@mui/icons-material/Person'
import { Chip, Grid, Stack, Typography } from '@mui/material'
import { Fragment, useMemo } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import { CollaboratorEntry, EntryInterface } from 'types/types'

type EntryCardRoleDialogProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryCardRoleDialogProps) {
  return (
    <>
      <Grid container spacing={2} paddingX={5} paddingBottom={2}>
        {entry.collaborators.map((user) => (
          <Fragment key={user.entity}>
            <Grid item xs={6}>
              <Stack direction='row' alignItems='center' spacing={1}>
                <EntryCollaboratorIcon entity={user} />
                <EntryCollaboratorName entity={user} />
              </Stack>
            </Grid>
            <Grid item xs={6}>
              {user.roles.length === 0 ? (
                <Typography>NO ROLES</Typography>
              ) : (
                user.roles.map((role) => {
                  return <Chip key={role} style={{ margin: 1 }} label={role} />
                })
              )}
            </Grid>
          </Fragment>
        ))}
      </Grid>
    </>
  )
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
