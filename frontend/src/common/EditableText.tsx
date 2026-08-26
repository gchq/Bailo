import EditIcon from '@mui/icons-material/Edit'
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { SyntheticEvent, useCallback, useMemo, useState } from 'react'
import LabelledValue from 'src/common/LabelledValue'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'

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

  const editButton = (
    <Tooltip title={tooltipText}>
      <IconButton size='small' aria-label={tooltipText} onClick={() => setIsEditMode(true)}>
        {loading ? <Loading /> : <EditIcon color='primary' fontSize='small' />}
      </IconButton>
    </Tooltip>
  )

  const content = isEditMode ? (
    <Box component='form' onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {richText ? (
        <Stack>
          <RichTextEditor value={newValue || ''} onChange={(input) => setNewValue(input)} aria-label={label} />
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
            aria-label={label}
          />
          {submitButtons}
        </Stack>
      )}
    </Box>
  ) : (
    displayValue(value, richText)
  )

  if (label) {
    return (
      <LabelledValue label={label} action={!isEditMode && editButton}>
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

function displayValue(value: string | undefined, richText: boolean) {
  if (!value) {
    return <Typography sx={{ fontStyle: 'italic' }}>Unset</Typography>
  }

  return richText ? <MarkdownDisplay>{value}</MarkdownDisplay> : <Typography>{value}</Typography>
}
