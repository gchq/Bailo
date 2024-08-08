import { Grid, Stack } from '@mui/material'
import { Fragment } from 'react'
import EntityIcon from 'src/entry/EntityIcon'
import EntityNameDisplay from 'src/entry/EntityNameDisplay'
import EntryCardRolesChipSet from 'src/entry/overview/EntryCardRolesChipSet'
import { CollaboratorEntry } from 'types/types'

type EntryCardEntityRoleRowProps = {
  entryCollaborators: CollaboratorEntry[]
}

export default function EntryCardEntityRoleRow({ entryCollaborators }: EntryCardEntityRoleRowProps) {
  return entryCollaborators.map((collaborator) => (
    <Fragment key={collaborator.entity}>
      <Grid item xs={6}>
        <Stack direction='row' alignItems='center' spacing={1}>
          <EntityIcon entryCollaborator={collaborator} />
          <EntityNameDisplay entryCollaborator={collaborator} />
        </Stack>
      </Grid>
      <Grid item xs={6}>
        <EntryCardRolesChipSet entryCollaborator={collaborator} />
      </Grid>
    </Fragment>
  ))
}
