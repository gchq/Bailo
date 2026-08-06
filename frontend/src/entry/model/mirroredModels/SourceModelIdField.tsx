import Check from '@mui/icons-material/Check'
import Close from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import { IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { patchEntry } from 'actions/entry'
import { useState } from 'react'
import Restricted from 'src/common/Restricted'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type SourceModelIdFieldProps = {
  entry: EntryInterface
  mutateEntry: () => void
}

export default function SourceModelIdField({ entry, mutateEntry }: SourceModelIdFieldProps) {
  const currentValue = entry.settings.mirror?.sourceModelId ?? ''
  const isImported = entry.mirroredCard?.metadata !== undefined

  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(currentValue)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSave = async () => {
    if (!value.trim()) {
      return
    }
    setErrorMessage('')
    const response = await patchEntry(entry.id, { settings: { mirror: { sourceModelId: value.trim() } } })
    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      setIsEditing(false)
      mutateEntry()
    }
  }

  const handleCancel = () => {
    setValue(currentValue)
    setErrorMessage('')
    setIsEditing(false)
  }

  return (
    <Stack spacing={0.5}>
      <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant='caption'>Source model ID:</Typography>
        {isEditing ? (
          <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
            <TextField
              size='small'
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              sx={{ minWidth: 250 }}
              slotProps={{ input: { sx: { fontSize: 'caption.fontSize' } } }}
              data-test='sourceModelIdInput'
            />
            <IconButton size='small' onClick={handleSave} disabled={!value.trim()} aria-label='Save source model ID'>
              <Check fontSize='small' />
            </IconButton>
            <IconButton size='small' onClick={handleCancel} aria-label='Cancel editing'>
              <Close fontSize='small' />
            </IconButton>
          </Stack>
        ) : (
          <Stack direction='row' spacing={0.5} sx={{ alignItems: 'center' }}>
            {isImported ? (
              <Tooltip title='The source model ID cannot be changed after import.'>
                <Typography variant='caption'>{currentValue}</Typography>
              </Tooltip>
            ) : (
              <>
                <Typography variant='caption'>{currentValue || <em>Not set</em>}</Typography>
                <Restricted action='editEntry' fallback={<></>}>
                  <IconButton size='small' onClick={() => setIsEditing(true)} aria-label='Edit source model ID'>
                    <EditIcon fontSize='small' />
                  </IconButton>
                </Restricted>
              </>
            )}
          </Stack>
        )}
      </Stack>
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
}
