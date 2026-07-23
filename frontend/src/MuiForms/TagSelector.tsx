import { Box, Button, Chip, Divider, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { useState } from 'react'
import CompareField from 'src/common/CompareField'
import InlineDiff from 'src/common/InlineDiff'
import getCompareFieldState from 'src/hooks/useCompareField'

interface TagEditorProps {
  editable: boolean
  value: string[]
  newTag: string
  setNewTag: (v: string) => void
  errorText: string
  label: string
  id: string
  onSubmit: () => void
  onDelete: (tag: string) => void
  emptyPlaceholderText: string
}

function TagEditor({
  editable,
  value,
  newTag,
  setNewTag,
  errorText,
  label,
  id,
  onSubmit,
  onDelete,
  emptyPlaceholderText,
}: TagEditorProps) {
  const theme = useTheme()

  if (!editable) {
    return value.length > 0 ? (
      <Box sx={{ overflow: 'auto', p: 1 }}>
        <Box sx={{ whiteSpace: 'pre-wrap' }}>
          {value.map((tag) => (
            <Chip label={tag} key={tag} sx={{ width: 'fit-content', m: 0.5 }} />
          ))}
        </Box>
      </Box>
    ) : (
      <Typography sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>
        {emptyPlaceholderText}
      </Typography>
    )
  }

  return (
    <Stack spacing={1}>
      <Stack
        direction={{ md: 'row', sm: 'column' }}
        spacing={2}
        divider={<Divider flexItem orientation='vertical' />}
        sx={{ alignItems: 'center' }}
      >
        <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            size='small'
            value={newTag}
            onKeyUp={(e) => {
              if (e.code === 'Enter') {
                onSubmit()
              }
            }}
            id={id}
            aria-label={`input field for ${label}`}
            onChange={(e) => setNewTag(e.target.value)}
            sx={{ minWidth: '100px' }}
          />
          <Button size='small' onClick={onSubmit}>
            Add tag
          </Button>
        </Stack>
        <Box sx={{ overflow: 'auto', p: 1 }}>
          <Stack spacing={1} direction='row'>
            {value.length === 0 ? (
              <Typography sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>
                {emptyPlaceholderText}
              </Typography>
            ) : (
              <Box sx={{ whiteSpace: 'pre-wrap' }}>
                {value.map((tag) => (
                  <Chip label={tag} key={tag} sx={{ width: 'fit-content', m: 0.5 }} onDelete={() => onDelete(tag)} />
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
  )
}

function formatTagValue(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) {
    return ''
  }
  return tags.join(', ')
}

interface TagSelectorProps {
  onChange: (newValue: string[]) => void
  value: string[]
  label: string
  editable?: boolean
  required?: boolean
  registry?: Registry
  id: string
  schema?: RJSFSchema
}

export default function TagSelector({
  onChange,
  value,
  label,
  editable = true,
  required,
  registry,
  id,
  schema,
}: TagSelectorProps) {
  const theme = useTheme()

  const [newTag, setNewTag] = useState('')
  const [errorText, setErrorText] = useState('')

  const handleNewTagSubmit = () => {
    setErrorText('')
    const trimmedTag = newTag.trim()

    if (!trimmedTag) {
      setErrorText('You cannot add an empty tag')
      return
    }

    const isDuplicate = value.some((tag) => tag.toLowerCase() === trimmedTag.toLowerCase())
    if (isDuplicate) {
      setErrorText('You cannot add duplicate tags')
      return
    }

    onChange([...value, trimmedTag])
    setNewTag('')
  }

  const handleChipOnDelete = (tag: string) => {
    onChange(value.filter((e) => e !== tag))
  }

  if (!registry?.formContext) {
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
        {schema?.description && (
          <Typography variant='caption' color='text.secondary'>
            {schema.description}
          </Typography>
        )}
        <TagEditor
          editable={editable}
          value={value}
          newTag={newTag}
          setNewTag={setNewTag}
          errorText={errorText}
          label={label}
          id={id}
          onSubmit={handleNewTagSubmit}
          onDelete={handleChipOnDelete}
          emptyPlaceholderText='No tags'
        />
      </Stack>
    )
  }

  const compare = getCompareFieldState<string[]>(id, registry.formContext)

  const formatTag = (val?: unknown): string | undefined => formatTagValue(val as string[] | undefined)

  return (
    <CompareField
      id={id}
      label={label}
      required={required}
      description={schema ? schema.description : ''}
      compare={compare}
      value={value}
      formatter={formatTag}
      hasValue={value.length > 0}
    >
      {compare.editMode ? (
        <TagEditor
          editable
          value={value}
          newTag={newTag}
          setNewTag={setNewTag}
          errorText={errorText}
          label={label}
          id={id}
          onSubmit={handleNewTagSubmit}
          onDelete={handleChipOnDelete}
          emptyPlaceholderText={registry.formContext.emptyPlaceholderText ?? 'No tags'}
        />
      ) : compare.inMirroredCompare && value.length > 0 ? (
        <InlineDiff from={formatTagValue(compare.compareFromState)} to={formatTagValue(value)} />
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
    </CompareField>
  )
}
