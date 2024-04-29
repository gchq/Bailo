import { Box, Chip, Stack, Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useTheme } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { FormContextType } from '@rjsf/utils'
import { ModelSearchResult, useListModels } from 'actions/model'
import { debounce } from 'lodash-es'
import { useRouter } from 'next/router'
import { KeyboardEvent, SyntheticEvent, useCallback, useEffect, useState } from 'react'
import { EntryKind } from 'types/types'

import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface DataCardSelectorProps {
  label?: string
  required?: boolean
  value: string[]
  onChange: (newValue: string[]) => void
  formContext?: FormContextType
  rawErrors?: string[]
}

export default function DataCardSelector(props: DataCardSelectorProps) {
  const { onChange, value: currentValue, required, label, formContext, rawErrors } = props

  const [open, setOpen] = useState(false)
  const [dataCardListQuery, setDataCardListQuery] = useState('')
  const [selectedDataCards, setSelectedDataCards] = useState<ModelSearchResult[]>([])

  const {
    models: dataCards,
    isModelsLoading: isDataCardsLoading,
    isModelsError: isDataCardsError,
  } = useListModels(EntryKind.DATA_CARD)

  const theme = useTheme()
  const router = useRouter()

  useEffect(() => {
    if (currentValue) {
      const updatedDataCards: ModelSearchResult[] = dataCards.filter((dataCard) => {
        if (currentValue.includes(dataCard.id)) {
          return dataCard
        }
      })
      setSelectedDataCards(updatedDataCards)
    }
  }, [currentValue, dataCards])

  const handleModelChange = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValues: ModelSearchResult[]) => {
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
    if (isDataCardsError.status !== 413) {
      return <MessageAlert message={isDataCardsError.info.message} severity='error' />
    }
  }

  return (
    <>
      {isDataCardsLoading && <Loading />}
      {formContext && formContext.editMode && (
        <Autocomplete<ModelSearchResult, true, true>
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
          filterOptions={(x) => x}
          onChange={handleModelChange}
          noOptionsText={dataCardListQuery.length < 3 ? 'Please enter at least three characters' : 'No options'}
          onInputChange={debounceOnInputChange}
          options={dataCards || []}
          renderTags={(value, getTagProps) =>
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
              label={label + (required ? ' *' : '')}
              onKeyDown={(event: KeyboardEvent) => {
                if (event.key === 'Backspace') {
                  event.stopPropagation()
                }
              }}
            />
          )}
        />
      )}
      {formContext && !formContext.editMode && (
        <>
          <Typography fontWeight='bold'>
            {label}
            {required && <span style={{ color: theme.palette.error.main }}>{' *'}</span>}
          </Typography>
          {currentValue.length === 0 && (
            <Typography
              sx={{
                fontStyle: 'italic',
                color: theme.palette.customTextInput.main,
              }}
            >
              Unanswered
            </Typography>
          )}
          <Box sx={{ overflowX: 'auto', p: 1 }}>
            <Stack spacing={1} direction='row'>
              {currentValue.map((currentDataCard) => (
                <Chip
                  label={
                    dataCards.find((dataCard) => dataCard.id === currentDataCard)?.name ||
                    'Unable to find data card name'
                  }
                  key={currentDataCard}
                  onClick={() => router.push(`/data-card/${currentDataCard}`)}
                  sx={{ width: 'fit-content' }}
                />
              ))}
            </Stack>
          </Box>
        </>
      )}
    </>
  )
}
