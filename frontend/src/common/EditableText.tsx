import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useCallback, useState } from 'react'
import RichTextEditor from 'src/common/RichTextEditor'

interface EditableTextProps {
  value: string
  onSubmit: (newValue: string) => void
  tooltipText?: string
  submitButtonText?: string
  multiline?: boolean
  richText?: boolean
}

export default function EditableText({
  value,
  onSubmit,
  tooltipText = 'Edit this text',
  submitButtonText = 'Submit',
  multiline = false,
  richText = false,
}: EditableTextProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [newValue, setNewValue] = useState(value)

  const previousText = value

  const handleCancelOnClick = useCallback(() => {
    setIsEditMode(false)
    setNewValue(previousText)
  }, [previousText])

  const handleSubmit = useCallback(() => {
    setIsEditMode(false)
    onSubmit(newValue)
  }, [newValue, onSubmit])

  const submitButtons = () => {
    return (
      <Stack direction='row' spacing={1} sx={{ py: 1 }} justifyContent='flex-end'>
        <Button variant='contained' type='submit' size='small'>
          {submitButtonText}
        </Button>{' '}
        <Button variant='outlined' onClick={handleCancelOnClick} size='small'>
          Cancel
        </Button>
      </Stack>
    )
  }

  return (
    <>
      {!isEditMode && (
        <Stack direction='row' spacing={1} alignItems='center'>
          <Tooltip title={tooltipText}>
            <IconButton onClick={() => setIsEditMode(true)}>
              <EditIcon color='primary' fontSize='small' />
            </IconButton>
          </Tooltip>
          <Typography>{value}</Typography>
        </Stack>
      )}
      {isEditMode && (
        <Box component='form' onSubmit={handleSubmit} sx={{ pl: 5 }}>
          {richText ? (
            <Stack>
              <RichTextEditor
                value={newValue}
                onChange={(input) => setNewValue(input)}
                aria-label='Schema description'
              />
              {submitButtons()}
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
              {submitButtons()}
            </Stack>
          )}
        </Box>
      )}
    </>
  )
}
