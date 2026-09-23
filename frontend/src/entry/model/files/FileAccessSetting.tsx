import { Button, Stack, Typography } from '@mui/material'
import { patchFile } from 'actions/file'
import { useContext, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import MessageAlert from 'src/MessageAlert'
import { FileInterface } from 'types/types'

interface FileAccessSettingProps {
  file: FileInterface
  onChange: () => void
}

export default function FileAccessSetting({ file, onChange }: FileAccessSettingProps) {
  const { userPermissions } = useContext(UserPermissionsContext)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const shared = file.ungovernedAccess === true

  async function save() {
    if (saving) {
      return
    }
    setSaving(true)
    setError('')
    try {
      const result = await patchFile(file.modelId, file._id, { ungovernedAccess: !shared })
      if (!result.status || result.status < 200 || result.status >= 300) {
        setError(typeof result.data === 'string' ? result.data : 'Unable to change file access. Please try again.')
        return
      }
      setOpen(false)
      onChange()
    } catch {
      setError('Unable to change file access. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={1}>
      {shared && (
        <Typography variant='caption'>This file can be downloaded by anyone who can view this model.</Typography>
      )}
      {userPermissions.editEntry.hasPermission && (
        <Button
          size='small'
          sx={{ width: 'fit-content' }}
          onClick={() => {
            setError('')
            setOpen(true)
          }}
        >
          {shared ? 'Require normal file access' : 'Allow downloads without an access request'}
        </Button>
      )}
      <ConfirmationDialogue
        open={open}
        title={shared ? 'Restore normal file access' : 'Allow access to this file'}
        dialogMessage={
          shared
            ? 'This file will follow the normal model access rules. Model-wide ungoverned access and existing access grants will still apply.'
            : 'Anyone who can view this model will be able to download this file without an access request. Other files will keep their existing access rules.'
        }
        onConfirm={save}
        onCancel={() => {
          if (!saving) {
            setOpen(false)
          }
        }}
        confirmLoading={saving}
        confirmDisabled={saving}
      >
        <MessageAlert message={error} severity='error' />
      </ConfirmationDialogue>
    </Stack>
  )
}
