import { Chip, Grid } from '@mui/material'
import { EntryInterface } from 'types/types'

type EntryCardRoleDialogProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryCardRoleDialogProps) {
  return (
    <>
      <Grid container spacing={2}>
        {entry.collaborators.map((user, index) => (
          <div key={index}>
            <Grid key={index} item xs={6}>
              <Chip label={user.entity} />
            </Grid>
            <Grid key={index} item xs={6}>
              <Chip label={user.roles} />
            </Grid>
          </div>
        ))}
      </Grid>
    </>
  )
}
