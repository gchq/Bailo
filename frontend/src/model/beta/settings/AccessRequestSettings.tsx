import { Button, Checkbox, Divider, Stack, Typography } from '@mui/material'
import { useState } from 'react'

export default function AccessRequestSettings() {
  const [allowUngoverned, setAllowUngoverned] = useState(false)

  return (
    <Stack spacing={2}>
      <Typography variant='h6' component='h2'>
        Manage access requests
      </Typography>
      <Stack direction='row' alignItems='center'>
        <Checkbox onChange={(event) => setAllowUngoverned(event.target.checked)} value={allowUngoverned} size='small' />
        <Typography>Allow users to make ungoverned access requests</Typography>
      </Stack>
      <Divider />
      <div>
        <Button variant='contained'>Save</Button>
      </div>
    </Stack>
  )
}
