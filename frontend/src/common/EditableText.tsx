import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import RichTextEditor from 'src/common/RichTextEditor'

interface EditableTextProps {
  value?: string
  onSubmit: (newValue: string | undefined) => void
  tooltipText?: string
  submitButtonText?: string
  multiline?: boolean
  richText?: boolean
  loading?: boolean
}

export default function EditableText({
  value,
  onSubmit,
  tooltipText = 'Edit this text',
  submitButtonText = 'Submit',
  multiline = false,
  richText = false,
  loading = false,
}: EditableTextProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [newValue, setNewValue] = useState(value)

  const handleCancelOnClick = useCallback(() => {
    setIsEditMode(false)
    setNewValue(value)
  }, [value])

  const handleSubmit = () => {
    setIsEditMode(false)
    if (newValue !== value) {
      onSubmit(newValue)
    }
  }

  const submitButtons = useMemo(() => {
    return (
      <Stack direction='row' spacing={1} sx={{ py: 1 }} justifyContent='flex-end'>
        <Button variant='contained' type='submit' size='small'>
          {submitButtonText}
        </Button>
        <Button variant='outlined' onClick={handleCancelOnClick} size='small'>
          Cancel
        </Button>
      </Stack>
    )
  }, [handleCancelOnClick, submitButtonText])

  return (
    <>
      {!isEditMode && (
        <Stack direction='row' spacing={1} alignItems='center'>
          <Tooltip title={tooltipText}>
            <IconButton onClick={() => setIsEditMode(true)}>
              {loading ? <Loading /> : <EditIcon color='primary' fontSize='small' />}
            </IconButton>
          </Tooltip>
          <Typography fontStyle={!value ? 'italic' : 'normal'}>{value || 'Empty'}</Typography>
        </Stack>
      )}
      {isEditMode && (
        <Box component='form' onSubmit={handleSubmit} sx={{ pl: 5 }}>
          {richText ? (
            <Stack>
              <RichTextEditor
                value={newValue || ''}
                onChange={(input) => setNewValue(input)}
                aria-label='Schema description'
              />
              {submitButtons}
            </Stack>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems='center'>
              <TextField
                sx={{ width: '100%' }}
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                size='small'
                multiline={multiline}
              />
              {submitButtons}
            </Stack>
          )}
        </Box>
      )}
    </>
  )
}
