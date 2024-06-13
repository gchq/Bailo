import { LoadingButton } from '@mui/lab'
import { Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material'
import { patchModel } from 'actions/model'
import { useState } from 'react'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type TemplateSettingsProps = {
  model: EntryInterface
}

export default function TemplateSettings({ model }: TemplateSettingsProps) {
  const [allowTemplate, setAllowTemplate] = useState(model.settings.allowTemplating)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const sendNotification = useNotification()

  async function handleSave() {
    setLoading(true)
    const updatedModelSettings = {
      settings: {
        ungovernedAccess: false,
        allowTemplating: allowTemplate,
      },
    }

    const response = await patchModel(model.id, updatedModelSettings)

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
    <Stack spacing={2}>
      <Typography variant='h6' component='h2'>
        Manage Template
      </Typography>
      <FormControlLabel
        label='Allow users to make a template'
        control={
          <Checkbox onChange={(event) => setAllowTemplate(event.target.checked)} checked={allowTemplate} size='small' />
        }
      />
      <Divider />
      <div>
        <LoadingButton variant='contained' aria-label='Save templating' onClick={handleSave} loading={loading}>
          Save
        </LoadingButton>
        <MessageAlert message={errorMessage} severity='error' />
      </div>
    </Stack>
  )
}
