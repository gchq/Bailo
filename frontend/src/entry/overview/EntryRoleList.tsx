import { Chip, Grid, Typography } from '@mui/material'
import { EntryInterface } from 'types/types'

type EntryCardRoleDialogProps = {
  entry: EntryInterface
}

export default function EntryRoleList({ entry }: EntryCardRoleDialogProps) {
  return (
    <>
      <Grid container spacing={2} paddingX={5} paddingBottom={2}>
        {entry.collaborators.map((user, index) => (
          <>
            <Grid key={index} item xs={6}>
              <Typography variant='h5' fontStyle={'bold'} borderRadius={2}>
                {user.entity}
              </Typography>
            </Grid>
            <Grid key={index} item xs={6}>
              {user.roles.map((role) => (
                <>
                  <Chip style={{ margin: 1 }} label={role} />
                </>
              ))}
            </Grid>
          </>
        ))}
      </Grid>
    </>
  )
}
