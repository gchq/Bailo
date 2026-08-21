import Save from '@mui/icons-material/Save'
import { Button, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material'
import { patchEntry } from 'actions/entry'
import { useContext, useEffect, useState } from 'react'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type TemplateSettingsProps = {
  model: EntryInterface
}

export default function TemplateSettings({ model }: TemplateSettingsProps) {
  const [allowTemplating, setAllowTemplating] = useState(model.settings.allowTemplating)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)
  const sendNotification = useNotification()

  useEffect(() => {
    setUnsavedChanges(hasUnsavedChanges)
  }, [hasUnsavedChanges, setUnsavedChanges])

  useEffect(() => {
    return () => setUnsavedChanges(false)
  }, [setUnsavedChanges])

  async function handleSave() {
    setLoading(true)
    const updatedModelSettings = {
      settings: {
        ungovernedAccess: model.settings.ungovernedAccess,
        allowTemplating,
      },
    }

    const response = await patchEntry(model.id, updatedModelSettings)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      sendNotification({
        variant: 'success',
        msg: 'Template settings updated',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
      setHasUnsavedChanges(false)
    }
    setLoading(false)
  }

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography variant='h6' component='h2' color='primary'>
        Manage templating
      </Typography>
      <Divider />
      <FormControlLabel
        label='Allow users to make a template'
        control={
          <Checkbox
            onChange={(event) => {
              setAllowTemplating(event.target.checked)
              setHasUnsavedChanges(true)
            }}
            checked={allowTemplating}
            size='small'
          />
        }
      />
      <div>
        <Button
          variant='contained'
          aria-label='Save model template settings'
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
