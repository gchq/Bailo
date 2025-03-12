import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { FormContextType } from '@rjsf/utils'
import { useState } from 'react'

interface TagSelectorProps {
  onChange: (newValue: string[]) => void
  value: string[]
  label: string
  formContext?: FormContextType
  required?: boolean
}

export default function TagSelector({ onChange, value, label, formContext, required }: TagSelectorProps) {
  const theme = useTheme()

  const [newTag, setNewTag] = useState('')
  const [errorText, setErrorText] = useState('')

  const handleNewTagSubmit = () => {
    setErrorText('')
    if (value.includes(newTag)) {
      setErrorText('You cannot add duplicate tags')
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

  return (
    <>
      {formContext && formContext.editMode && (
        <Stack spacing={1}>
          <Typography fontWeight='bold'>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
          <Stack direction='row' spacing={2}>
            <TextField size='small' value={newTag} onChange={(e) => setNewTag(e.target.value)} />
            <Button size='small' onClick={handleNewTagSubmit}>
              Add tag
            </Button>
          </Stack>
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {value.map((tag) => (
                <Chip
                  label={tag}
                  key={tag}
                  onDelete={() => handleChipOnDelete(tag)}
                  sx={{
                    width: 'fit-content',
                    input: {
                      color: theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
                    },
                    label: {
                      WebkitTextFillColor:
                        theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor:
                        theme.palette.mode === 'light' ? theme.palette.common.black : theme.palette.common.white,
                    },
                    fontStyle: value ? 'unset' : 'italic',
                  }}
                />
              ))}
            </Stack>
          </Box>
          <Typography variant='caption' color={theme.palette.error.main}>
            {errorText}
          </Typography>
        </Stack>
      )}
      {formContext && !formContext.editMode && (
        <>
          <Typography fontWeight='bold'>{label}</Typography>
          {value.length === 0 && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.text.primary,
              }}
            >
              Unanswered
            </Typography>
          )}
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {value.map((tag) => (
                <Chip label={tag} color='secondary' key={tag} sx={{ width: 'fit-content' }} />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </>
  )
}
