import EditIcon from '@mui/icons-material/Edit'
import { Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
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
  const [newValue, setNewValue] = useState('')
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
        <Stack direction='row' spacing={1} sx={{ p: 2 }}>
          <TextField value={value} onChange={(event) => setNewValue(event.target.value)} size='small' />
          <Button variant='outlined' onClick={() => setIsEditMode(false)} size='small'>
            Cancel
          </Button>
          <Button variant='contained' onClick={() => onSubmit(newValue)} size='small'>
            {submitButtonText}
          </Button>
        </Stack>
      )}
    </>
  )
}
