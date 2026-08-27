import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, IconButton, Stack, TextField, Tooltip } from '@mui/material'
import { SyntheticEvent, useCallback, useMemo, useState } from 'react'
import LabelledValue from 'src/common/LabelledValue'
import Loading from 'src/common/Loading'
import RichTextEditor from 'src/common/RichTextEditor'
import ValueDisplay from 'src/common/ValueDisplay'

interface EditableTextProps {
  value?: string
  onSubmit: (newValue: string | undefined) => void
  label?: string
  tooltipText?: string
  submitButtonText?: string
  multiline?: boolean
  richText?: boolean
  loading?: boolean
}

export default function EditableText({
  value,
  onSubmit,
  label,
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

  const inputLabel = label ?? tooltipText

  const content = isEditMode ? (
    <Box component='form' onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {richText ? (
        <Stack>
          <RichTextEditor value={newValue || ''} onChange={(input) => setNewValue(input)} aria-label={inputLabel} />
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
            aria-label={inputLabel}
          />
          {submitButtons}
        </Stack>
      )}
    </Box>
  ) : (
    <ValueDisplay value={value} richText={richText} />
  )

  if (label) {
    return (
      <LabelledValue label={label} action={isEditMode ? undefined : editButton}>
        {content}
      </LabelledValue>
    )
  }

  return (
    <Stack
      direction='row'
      spacing={1}
      sx={{
        alignItems: 'center',
      }}
    >
      {content}
      {!isEditMode && editButton}
    </Stack>
  )
}
