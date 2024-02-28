import { DialogContent, Stack, Typography } from '@mui/material'

export default function DockerConfig() {
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
        <Typography>First, download the Docker credentials for the application token: </Typography>
        {/* TODO */}
        <Typography>{`Download <key-name>-auth.yml / `}</Typography>
        <Typography>{`View <key-name>-auth.yml`}</Typography>
        <Typography fontWeight='bold'>Step 2: Write to disk:</Typography>
        <Typography>
          Second, place the file in the Docker configuration Directory. Note: This will overwrite existing credentials:
        </Typography>
        {/* TODO */}
        <Typography>{`mv <key-name>-auth.json ~/.docker/config.json`}</Typography>
      </Stack>
    </DialogContent>
  )
}
