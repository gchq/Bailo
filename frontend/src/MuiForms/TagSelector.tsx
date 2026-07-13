import { Box, Button, Chip, Divider, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getMirroredState } from 'utils/formUtils'

interface TagSelectorProps {
  onChange: (newValue: string[]) => void
  value: string[]
  label: string
  registry: Registry
  required?: boolean
  id: string
  schema?: RJSFSchema
}

export default function TagSelector({ onChange, value, label, registry, required, id, schema }: TagSelectorProps) {
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

  if (!registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const mirroredState = getMirroredState(id, registry.formContext)

  return (
    <AdditionalInformation
      editMode={registry.formContext.editMode}
      mirroredState={mirroredState}
      display={registry.formContext.mirroredModel && value}
      label={label}
      id={id}
      required={required}
      mirroredModel={registry.formContext.mirroredModel}
      description={schema ? schema.description : ''}
    >
      {registry.formContext && registry.formContext.editMode && (
        <Stack spacing={1}>
          <Stack
            direction={{ md: 'row', sm: 'column' }}
            spacing={2}
            divider={<Divider flexItem orientation='vertical' />}
            sx={{
              alignItems: 'center',
            }}
          >
            <Stack
              direction='row'
              spacing={2}
              sx={{
                alignItems: 'center',
              }}
            >
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
                    {registry.formContext && registry.formContext.emptyPlaceholderText
                      ? registry.formContext.emptyPlaceholderText
                      : 'Unanswered'}
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
      {!registry.formContext.editMode && (
        <Box sx={{ overflow: 'auto', p: 1 }}>
          <Stack spacing={1} direction='row'>
            {value.length === 0 ? (
              <Typography
                sx={{
                  fontStyle: 'italic',
                  color: theme.palette.customTextInput.main,
                }}
              >
                {registry.formContext && registry.formContext.emptyPlaceholderText
                  ? registry.formContext.emptyPlaceholderText
                  : 'Unanswered'}
              </Typography>
            ) : (
              <Box sx={{ whitespace: 'pre-wrap' }}>
                {value.map((tag) => (
                  <Chip label={tag} key={tag} sx={{ width: 'fit-content', m: 0.5 }} />
                ))}
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </AdditionalInformation>
  )
}
