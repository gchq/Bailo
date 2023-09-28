import { Alert, Button, Checkbox, Stack, Typography } from '@mui/material'
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
        <Typography>
          <b>Enable public model access</b> - This will enable users to access models artefacts without prior approval.
        </Typography>
      </Stack>
      <Stack direction='row' alignItems='center'>
        <Checkbox onChange={(event) => setAllowUngoverned(event.target.checked)} value={allowUngoverned} size='small' />
        <Typography>
          <b>Enable development model access</b> - This will allow users to request model access for non-operational
          environments.
        </Typography>
      </Stack>
      <div>
        <Button>Save</Button>
      </div>
    </Stack>
  )
}
