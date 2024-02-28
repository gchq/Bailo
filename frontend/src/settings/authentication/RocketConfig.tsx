import DownloadIcon from '@mui/icons-material/Download'
import { DialogContent, Grid, Stack, Typography } from '@mui/material'

export default function RocketConfig() {
  return (
    <DialogContent
      sx={{
        width: '600px',
        height: '400px',
        overflow: 'auto',
      }}
    >
      <Stack spacing={2} direction={{ xs: 'column' }}>
        <Typography fontWeight='bold'>Step 1: Download credentials config</Typography>
        <Typography>First, download the rkt credentials file for the personal access token:</Typography>
        {/* TODO */}
        <Grid container spacing={0} alignItems='center'>
          <DownloadIcon color='primary' />
          <Typography>{`<key-name>-auth.yml `}</Typography>
        </Grid>
        <Typography>{'View <key-name>-auth.yml'}</Typography>
        <Typography fontWeight='bold'>Step 2: Write to disk</Typography>
        <Typography>Second, place the file in the rkt configuration directory:</Typography>
        {/* TODO */}
        <Typography>{'mv <key-name>-auth.json /etc/rkt/auth.d/'}</Typography>
      </Stack>
    </DialogContent>
  )
}
