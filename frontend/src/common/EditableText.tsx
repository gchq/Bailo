import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, IconButton, Stack, TextField, Tooltip } from '@mui/material'
import { SyntheticEvent, useCallback, useMemo, useState } from 'react'
import LabelledValue from 'src/common/LabelledValue'
import Loading from 'src/common/Loading'
import RichTextEditor from 'src/common/RichTextEditor'

interface EditableTextProps {
  label: string
  value?: string
  onSubmit: (newValue: string | undefined) => void
  tooltipText?: string
  submitButtonText?: string
  multiline?: boolean
  richText?: boolean
  loading?: boolean
}

export default function EditableText({
  label,
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

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsEditMode(false)
    if (newValue !== value) {
      onSubmit(newValue)
    }
  }

  const submitButtons = useMemo(() => {
    return (
      <Stack
        direction='row'
        spacing={1}
        sx={{
          justifyContent: 'flex-end',
          py: 1,
        }}
      >
        <Button variant='outlined' onClick={handleCancelOnClick} size='small'>
          Cancel
        </Button>
        <Button variant='contained' type='submit' size='small'>
          {submitButtonText}
        </Button>
      </Stack>
    )
  }, [handleCancelOnClick, submitButtonText])

  const handleEditOnClick = useCallback(() => {
    // Resync with the latest value in case it has changed since this component was mounted.
    setNewValue(value)
    setIsEditMode(true)
  }, [value])

  const editButton = (
    <Tooltip title={tooltipText}>
      <IconButton size='small' aria-label={tooltipText} onClick={handleEditOnClick}>
        {loading ? <Loading /> : <EditIcon color='primary' fontSize='small' />}
      </IconButton>
    </Tooltip>
  )

  if (!isEditMode) {
    return <LabelledValue label={label} value={value} richText={richText} action={editButton} />
  }

  return (
    <LabelledValue label={label}>
      <Box component='form' onSubmit={handleSubmit} sx={{ width: '100%' }}>
        {richText ? (
          <Stack>
            <RichTextEditor
              value={newValue || ''}
              onChange={(input) => setNewValue(input)}
              textareaProps={{ 'aria-label': label }}
            />
            {submitButtons}
          </Stack>
        ) : (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <TextField
              sx={{ width: '100%' }}
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              size='small'
              multiline={multiline}
              slotProps={{ htmlInput: { 'aria-label': label } }}
            />
            {submitButtons}
          </Stack>
        )}
      </Box>
    </LabelledValue>
  )
}
