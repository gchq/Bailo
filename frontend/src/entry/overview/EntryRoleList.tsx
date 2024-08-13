import { Grid, Stack } from '@mui/material'
import { Fragment, useMemo } from 'react'
import EntityIcon from 'src/entry/EntityIcon'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryRolesChipSet from 'src/entry/overview/EntryRolesChipSet'
import { EntryInterface } from 'types/types'

type EntryRoleListProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryRoleListProps) {
  const rows = useMemo(
    () =>
      entry.collaborators.map((collaborator) => (
        <Fragment key={collaborator.entity}>
          <Grid item xs={6}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <EntityIcon entryCollaborator={collaborator} />
              <EntityNameDisplay entryCollaborator={collaborator} />
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <EntryRolesChipSet entryCollaborator={collaborator} />
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
