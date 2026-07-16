import { Box, Chip, Stack } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { Registry, RJSFSchema } from '@rjsf/utils'
import { EntrySearchResult, useListEntries } from 'actions/entry'
import { debounce } from 'lodash-es'
import { useRouter } from 'next/router'
import { KeyboardEvent, SyntheticEvent, useCallback, useEffect, useState } from 'react'
import CompareField from 'src/common/CompareField'
import InlineDiff from 'src/common/InlineDiff'
import getCompareFieldState from 'src/hooks/useCompareField'
import { EntryKind } from 'types/types'

import MessageAlert from '../MessageAlert'

interface DataCardSelectorProps {
  id: string
  label: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
  registry?: Registry
  rawErrors?: string[]
  schema: RJSFSchema
}

export default function DataCardSelector({
  onChange,
  value: currentValue,
  required,
  label,
  id,
  registry,
  rawErrors,
  schema,
}: DataCardSelectorProps) {
  const [open, setOpen] = useState(false)
  const [dataCardListQuery, setDataCardListQuery] = useState('')

  const {
    entries: dataCards,
    isEntriesLoading: isDataCardsLoading,
    isEntriesError: isDataCardsError,
  } = useListEntries(EntryKind.DATA_CARD)

  const [selectedDataCards, setSelectedDataCards] = useState<EntrySearchResult[]>([])

  useEffect(() => {
    if (!dataCards || !currentValue) {
      return
    }

    setSelectedDataCards(dataCards.filter((card) => currentValue.includes(card.id)))
  }, [dataCards, currentValue])

  const router = useRouter()

  const handleSelectedDataCardsChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValues: EntrySearchResult[]) => {
      onChange(newValues.map((value) => value.id))
      setSelectedDataCards(newValues)
    },
    [onChange],
  )

  const handleInputChange = useCallback((_event: SyntheticEvent<Element, Event>, value: string) => {
    setDataCardListQuery(value)
  }, [])

  const debounceOnInputChange = debounce((event: SyntheticEvent<Element, Event>, value: string) => {
    handleInputChange(event, value)
  }, 500)

  if (isDataCardsError) {
    return <MessageAlert message={isDataCardsError.info.message} severity='error' />
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
      .map((cardId) => dataCards?.find((dataCard) => dataCard.id === cardId)?.name ?? 'Unable to find data card name')
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
          data-test='dataCardSelector'
          loading={dataCardListQuery.length > 3 && isDataCardsLoading}
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
          value={selectedDataCards || []}
          onChange={handleSelectedDataCardsChange}
          noOptionsText={dataCardListQuery.length < 3 ? 'Please enter at least three characters' : 'No options'}
          onInputChange={debounceOnInputChange}
          options={dataCards || []}
          renderValue={(value, getTagProps) =>
            value.map((option, index) => (
              <Box key={option.name} sx={{ maxWidth: '200px' }}>
                <Chip {...getTagProps({ index })} sx={{ textOverflow: 'ellipsis' }} label={option.name} />
              </Box>
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder='Data card name'
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
      ) : (
        currentValue.length > 0 && (
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {currentValue.map((currentDataCardId) => (
                <Chip
                  label={
                    dataCards.find((dataCard) => dataCard.id === currentDataCardId)?.name ||
                    'Unable to find data card name'
                  }
                  key={currentDataCardId}
                  onClick={() => router.push(`/data-card/${currentDataCardId}`)}
                  sx={{ width: 'fit-content' }}
                />
              ))}
            </Stack>
          </Box>
        )
      )}
    </CompareField>
  )
}
