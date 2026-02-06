import { Save } from '@mui/icons-material'
import { Button, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material'
import { patchEntry } from 'actions/entry'
import { useState } from 'react'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type AccessRequestSettingsProps = {
  model: EntryInterface
}

export default function AccessRequestSettings({ model }: AccessRequestSettingsProps) {
  const [allowUngoverned, setAllowUngoverned] = useState(model.settings.ungovernedAccess)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const sendNotification = useNotification()

  async function handleSave() {
    setLoading(true)

    const updatedModelSettings = {
      settings: {
        ungovernedAccess: allowUngoverned,
        allowTemplating: model.settings.allowTemplating,
      },
    }

    const response = await patchEntry(model.id, updatedModelSettings)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      sendNotification({
        variant: 'success',
        msg: 'Access request settings updated',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
    setLoading(false)
  }

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography variant='h6' component='h2' color='primary'>
        Manage access requests
      </Typography>
      <Divider />
      <FormControlLabel
        label='Allow users to make ungoverned access requests'
        control={
          <Checkbox
            onChange={(event) => setAllowUngoverned(event.target.checked)}
            checked={allowUngoverned}
            size='small'
          />
        }
      />
      <div>
        <Button
          variant='contained'
          aria-label='Save ungoverned access requests'
          onClick={handleSave}
          loading={loading}
          startIcon={<Save />}
        >
          Save
        </Button>
        <MessageAlert message={errorMessage} severity='error' />
      </div>
    </Stack>
  )
}
