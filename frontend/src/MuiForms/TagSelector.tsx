import { Box, Button, Chip, Divider, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { useState } from 'react'
import InlineDiff from 'src/common/InlineDiff'
import MessageAlert from 'src/MessageAlert'
import AdditionalInformation from 'src/MuiForms/AdditionalInformation'
import { getCompareFromMirroredState, getCompareFromState, getMirroredState } from 'utils/formUtils'

interface TagSelectorProps {
  onChange: (newValue: string[]) => void
  value: string[]
  label: string
  formContext?: Registry['formContext']
  required?: boolean
  id: string
  schema?: RJSFSchema
}

function formatTagValue(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) {
    return ''
  }
  return tags.join(', ')
}

export default function TagSelector({ onChange, value, label, formContext, required, id, schema }: TagSelectorProps) {
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

  const mirroredState = getMirroredState(id, formContext)
  const compareFromState = getCompareFromState(id, formContext) as string[] | undefined
  const compareFromMirroredState = getCompareFromMirroredState(id, formContext) as string[] | undefined
  const inCompareMode = !!formContext.compareMode && !formContext.editMode

  const currentValueString = formatTagValue(value)
  const compareFromString = formatTagValue(compareFromState)
  const mirroredStateString = formatTagValue(mirroredState as string[] | undefined)
  const compareFromMirroredString = formatTagValue(compareFromMirroredState)

  if (inCompareMode && !formContext.mirroredModel) {
    const from = compareFromState ? compareFromString : mirroredStateString
    return (
      <Stack spacing={1}>
        <Typography
          id={`${id}-label`}
          aria-label={`Label for ${label}`}
          component='label'
          htmlFor={id}
          sx={{ fontWeight: 'bold' }}
        >
          {label}
          {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
        </Typography>
        <InlineDiff from={from} to={currentValueString} />
      </Stack>
    )
  }

  const mirroredContent =
    inCompareMode && formContext.mirroredModel ? (
      <InlineDiff from={compareFromMirroredString} to={mirroredStateString} />
    ) : (
      mirroredState
    )

  return (
    <AdditionalInformation
      editMode={formContext.editMode}
      mirroredState={mirroredContent}
      display={inCompareMode && formContext.mirroredModel ? true : formContext.mirroredModel && value.length > 0}
      label={label}
      id={id}
      required={required}
      mirroredModel={formContext.mirroredModel}
      description={schema ? schema.description : ''}
    >
      {formContext.editMode ? (
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
      ) : inCompareMode && formContext.mirroredModel && value.length > 0 ? (
        <InlineDiff from={compareFromString} to={currentValueString} />
      ) : (
        value.length > 0 && (
          <Box sx={{ overflow: 'auto', p: 1 }}>
            <Box sx={{ whiteSpace: 'pre-wrap' }}>
              {value.map((tag) => (
                <Chip label={tag} key={tag} sx={{ width: 'fit-content', m: 0.5 }} />
              ))}
            </Box>
          </Box>
        )
      )}
    </AdditionalInformation>
  )
}
