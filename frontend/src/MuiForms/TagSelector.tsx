import { Box, Button, Chip, Divider, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry } from '@rjsf/utils'
import { useState } from 'react'
import MessageAlert from 'src/MessageAlert'

interface TagSelectorProps {
  onChange: (newValue: string[]) => void
  value: string[]
  label: string
  formContext?: Registry['formContext']
  required?: boolean
  id: string
}

export default function TagSelector({ onChange, value, label, formContext, required, id }: TagSelectorProps) {
  const theme = useTheme()

  const [newTag, setNewTag] = useState('')
  const [errorText, setErrorText] = useState('')

  const handleNewTagSubmit = () => {
    setErrorText('')
    const isDuplicate = value.some((tag) => tag.toLowerCase() === newTag.toLowerCase())
    if (isDuplicate) {
      setErrorText('You cannot add duplicate tags')
      return
    }
    if (!newTag.trim()) {
      setErrorText('You cannot add an empty tag')
      return
    }

    const updatedArray = value
    updatedArray.push(newTag)
    onChange(updatedArray)
    setNewTag('')
  }

  const handleChipOnDelete = (tag: string) => {
    const updatedArray = value.filter((e) => e !== tag)
    onChange(updatedArray)
  }

  if (!formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  return (
    <>
      {formContext && formContext.editMode && (
        <Stack spacing={1}>
          <Typography fontWeight='bold' aria-label={`label for ${label}`} component='label' htmlFor={id}>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
          <Stack
            direction={{ md: 'row', sm: 'column' }}
            spacing={2}
            alignItems='center'
            divider={<Divider flexItem orientation='vertical' />}
          >
            <Stack direction='row' spacing={2} alignItems='center'>
              <TextField
                size='small'
                value={newTag}
                onKeyUp={(e) => {
                  if (e.code === 'Enter') {
                    handleNewTagSubmit()
                  }
                }}
                id={id}
                aria-label={`input field for ${label}`}
                onChange={(e) => setNewTag(e.target.value)}
                sx={{ minWidth: '100px' }}
              />
              <Button size='small' onClick={handleNewTagSubmit}>
                Add tag
              </Button>
            </Stack>
            <Box sx={{ overflow: 'auto', p: 1 }}>
              <Stack spacing={1} direction='row'>
                {value.length === 0 ? (
                  <Typography
                    sx={{
                      fontStyle: 'italic',
                      color: theme.palette.customTextInput.main,
                    }}
                  >
                    {formContext && formContext.emptyPlaceholderText ? formContext.emptyPlaceholderText : 'No tags'}
                  </Typography>
                ) : (
                  <Box sx={{ whitespace: 'pre-wrap' }}>
                    {value.map((tag) => (
                      <Chip
                        label={tag}
                        key={tag}
                        sx={{ width: 'fit-content', m: 0.5 }}
                        onDelete={() => handleChipOnDelete(tag)}
                      />
                    ))}
                  </Box>
                )}
              </Stack>
            </Box>
          </Stack>
          <Typography variant='caption' color={theme.palette.error.main}>
            {errorText}
          </Typography>
        </Stack>
      )}
    </>
  )
}
