import { Grid, Stack } from '@mui/material'
import { useGetEntryRoles } from 'actions/entry'
import { Fragment, useMemo } from 'react'
import renderQueryState from 'src/common/renderQueryState'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryRolesChipSet from 'src/entry/overview/EntryRolesChipSet'
import { EntryInterface } from 'types/types'

type EntryRoleListProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryRoleListProps) {
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles(entry.id)
  const rows = useMemo(
    () =>
      entry.collaborators.map((collaborator) => (
        <Fragment key={collaborator.entity}>
          <Grid size={{ xs: 6 }}>
            <Stack
              direction='row'
              spacing={1}
              sx={{
                alignItems: 'center',
              }}
            >
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

  const queryState = renderQueryState([isEntryRolesError], isEntryRolesLoading)
  if (queryState) {
    return queryState
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6 }}>Entity</Grid>
      <Grid size={{ xs: 6 }}>Roles</Grid>
      {rows}
    </Grid>
  )
}
