import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'

interface EditableTextProps {
  value: string
  onSubmit: (newValue: string) => void
  tooltipText?: string
  submitButtonText?: string
}

export default function EditableText({
  value,
  onSubmit,
  tooltipText = 'Edit this text',
  submitButtonText = 'Submit',
}: EditableTextProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [newValue, setNewValue] = useState(value)

  const previousText = value

  function handleCancelOnClick() {
    setIsEditMode(false)
    setNewValue(previousText)
  }

  function handleSubmit() {
    setIsEditMode(false)
    onSubmit(newValue)
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
        <Box component='form' onSubmit={handleSubmit}>
          <Stack direction='row' spacing={1} sx={{ p: 2 }}>
            <TextField value={newValue} onChange={(event) => setNewValue(event.target.value)} size='small' />
            <Button variant='outlined' onClick={handleCancelOnClick} size='small'>
              Cancel
            </Button>
            <Button variant='contained' type='submit' size='small'>
              {submitButtonText}
            </Button>
          </Stack>
        </Box>
      )}
    </>
  )
}
