import { Grid } from '@mui/material'
import EntryCardEntityRoleRowProps from 'src/entry/overview/EntryCardEntityRoleRow'
import { EntryInterface } from 'types/types'

type EntryCardRoleDialogProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryCardRoleDialogProps) {
  return (
    <>
      <Grid container spacing={2} paddingX={5} paddingBottom={2}>
        <Grid item xs={6}>
          Entity
        </Grid>
        <Grid item xs={6}>
          Roles
        </Grid>
        <EntryCardEntityRoleRowProps entryCollaborators={entry.collaborators} />
      </Grid>
    </>
  )
}
