import { Box, Chip, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { EntrySearchResult, useListEntries } from 'actions/entry'
import { debounce } from 'lodash-es'
import { KeyboardEvent, SyntheticEvent, useCallback, useEffect, useState } from 'react'
import CompareField from 'src/common/CompareField'
import InlineDiff from 'src/common/InlineDiff'
import getCompareFieldState from 'src/hooks/useCompareField'
import ModelSelectorChip from 'src/MuiForms/ModelSelectorChip'
import { EntryKind } from 'types/types'

import MessageAlert from '../MessageAlert'

interface ModelSelectorProps {
  id: string
  label: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
  registry?: Registry
  rawErrors?: string[]
  schema: RJSFSchema
}

export default function ModelSelector({
  onChange,
  value: currentValue,
  required,
  label,
  id,
  registry,
  rawErrors,
  schema,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [modelListQuery, setModelListQuery] = useState('')
  const theme = useTheme()

  const {
    entries: models,
    isEntriesLoading: isModelsLoading,
    isEntriesError: isModelsError,
  } = useListEntries(EntryKind.MODEL)

  const [selectedModels, setSelectedModels] = useState<EntrySearchResult[]>([])

  useEffect(() => {
    if (!models || !currentValue) {
      return
    }

    setSelectedModels(models.filter((card) => currentValue.includes(card.id)))
  }, [models, currentValue])

  const handleSelectedModelsChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValues: EntrySearchResult[]) => {
      onChange(newValues.map((value) => value.id))
      setSelectedModels(newValues)
    },
    [onChange],
  )

  const handleInputChange = useCallback((_event: SyntheticEvent<Element, Event>, value: string) => {
    setModelListQuery(value)
  }, [])

  const debounceOnInputChange = debounce((event: SyntheticEvent<Element, Event>, value: string) => {
    handleInputChange(event, value)
  }, 500)

  if (isModelsError) {
    return <MessageAlert message={isModelsError.info.message} severity='error' />
  }

  if (!registry || !registry.formContext) {
    return <MessageAlert message='Unable to render widget due to missing context' severity='error' />
  }

  const compare = getCompareFieldState<string[]>(id, registry.formContext)

  const idsToDiffString = (val?: unknown): string | undefined => {
    const ids = val as string[] | undefined
    if (!ids || ids.length === 0) {
      return ''
    }
    return ids
      .map((cardId) => models?.find((model) => model.id === cardId)?.name ?? 'Unable to find model name')
      .sort((a, b) => a.localeCompare(b))
      .join('\n')
  }

  return (
    <CompareField
      id={id}
      label={label}
      required={required}
      description={schema.description}
      compare={compare}
      value={currentValue}
      formatter={idsToDiffString}
      hasValue={currentValue.length > 0}
      fallbackMirroredContent={idsToDiffString(compare.mirroredState)}
    >
      {compare.editMode ? (
        <Autocomplete<EntrySearchResult, true, true>
          multiple
          data-test='modelSelector'
          loading={modelListQuery.length > 3 && isModelsLoading}
          open={open}
          size='small'
          onOpen={() => {
            setOpen(true)
          }}
          onClose={() => {
            setOpen(false)
          }}
          disableClearable
          isOptionEqualToValue={(option, value) => option.id === value.id}
          getOptionLabel={(option) => option.name}
          value={selectedModels || []}
          onChange={handleSelectedModelsChange}
          noOptionsText={modelListQuery.length < 3 ? 'Please enter at least three characters' : 'No options'}
          onInputChange={debounceOnInputChange}
          options={models || []}
          renderValue={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                sx={{ textOverflow: 'ellipsis', maxWidth: '200px' }}
                {...getTagProps({ index })}
                key={option.name}
                label={option.name}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder='Model name'
              error={rawErrors && rawErrors.length > 0}
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === 'Backspace') {
                  event.stopPropagation()
                }
              }}
            />
          )}
        />
      ) : compare.inMirroredCompare && currentValue.length > 0 ? (
        <InlineDiff from={idsToDiffString(compare.compareFromState)} to={idsToDiffString(currentValue)} />
      ) : currentValue.length > 0 ? (
        <Box sx={{ overflowX: 'auto', p: 1 }}>
          <Stack spacing={1} direction='row'>
            {currentValue.map((currentModelId) => (
              <ModelSelectorChip
                key={currentModelId}
                label={models.find((model) => model.id === currentModelId)?.name || 'Unable to find model name'}
                modelId={currentModelId}
              />
            ))}
          </Stack>
        </Box>
      ) : (
        <Typography component='span' sx={{ fontStyle: 'italic', color: theme.palette.customTextInput.main }}>
          Unanswered
        </Typography>
      )}
    </CompareField>
  )
}
