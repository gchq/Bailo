import { Grid, Stack } from '@mui/material'
import { useGetEntryRoles } from 'actions/model'
import { Fragment, useMemo } from 'react'
import Loading from 'src/common/Loading'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryRolesChipSet from 'src/entry/overview/EntryRolesChipSet'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

type EntryRoleListProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryRoleListProps) {
  const {
    entryRoles: entryRoles,
    isEntryRolesLoading: isEntryRolesLoading,
    isEntryRolesError: isEntryRolesError,
  } = useGetEntryRoles(entry.id)
  const rows = useMemo(
    () =>
      entry.collaborators.map((collaborator) => (
        <Fragment key={collaborator.entity}>
          <Grid size={{ xs: 6 }}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <EntityNameDisplay entryCollaborator={collaborator} />
            </Stack>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <EntryRolesChipSet entryCollaborator={collaborator} modelRoles={entryRoles} />
          </Grid>
        </Fragment>
      )),
    [entry.collaborators, entryRoles],
  )

  if (isEntryRolesLoading) {
    return <Loading />
  }

  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} severity='error' />
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6 }}>Entity</Grid>
      <Grid size={{ xs: 6 }}>Roles</Grid>
      {rows}
    </Grid>
  )
}
