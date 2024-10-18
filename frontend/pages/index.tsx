import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  Button,
  Container,
  FilledInput,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
} from '@mui/material/'
import { useTheme } from '@mui/material/styles'
import { useListModels } from 'actions/model'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ChangeEvent, Fragment, useCallback, useEffect, useState } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import Loading from 'src/common/Loading'
import PaginationSelector from 'src/common/PaginationSelector'
import Title from 'src/common/Title'
import useDebounce from 'src/hooks/useDebounce'
import EntryList from 'src/marketplace/EntryList'
import { EntryKind, EntryKindKeys } from 'types/types'

interface KeyAndLabel {
  key: string
  label: string
}

const searchFilterTypeLabels: KeyAndLabel[] = [{ key: 'mine', label: 'Mine' }]

export default function Marketplace() {
  // TODO - fetch model tags from API
  const [filter, setFilter] = useState('')
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([])
  const [selectedTask, setSelectedTask] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState<EntryKindKeys>(EntryKind.MODEL)
  const [currentPage, setCurrentPage] = useState<number | string>(1)
  const debouncedFilter = useDebounce(filter, 250)

  const { models, totalModels, isModelsError, isModelsLoading } = useListModels(
    EntryKind.MODEL,
    selectedTypes,
    selectedTask,
    selectedLibraries,
    debouncedFilter,
    undefined,
    undefined,
    currentPage,
  )

  const {
    models: dataCards,
    isModelsError: isDataCardsError,
    isModelsLoading: isDataCardsLoading,
  } = useListModels(EntryKind.DATA_CARD, selectedTypes, selectedTask, selectedLibraries, debouncedFilter)

  const theme = useTheme()
  const router = useRouter()

  const { filter: filterFromQuery, task: taskFromQuery, libraries: librariesFromQuery } = router.query

  useEffect(() => {
    if (filterFromQuery) setFilter(filterFromQuery as string)
    if (taskFromQuery) setSelectedTask(taskFromQuery as string)
    if (librariesFromQuery) {
      let librariesAsArray: string[] = []
      if (typeof librariesFromQuery === 'string') {
        librariesAsArray.push(librariesFromQuery)
      } else {
        librariesAsArray = [...librariesFromQuery]
      }
      setSelectedLibraries([...librariesAsArray])
    }
  }, [filterFromQuery, taskFromQuery, librariesFromQuery])

  const handleSelectedTypesOnChange = useCallback((selected: string[]) => {
    if (selected.length > 0) {
      const types: string[] = []
      selected.forEach((value) => {
        const typeToAdd = searchFilterTypeLabels.find((typeLabel) => typeLabel.label === value)
        if (typeToAdd && typeToAdd.label) {
          types.push(typeToAdd.key)
        }
      })
      setSelectedTypes(types)
    } else {
      setSelectedTypes([])
    }
  }, [])

  const updateQueryParams = useCallback(
    (key: string, value: string | string[]) => {
      router.replace({
        query: { ...router.query, [key]: value },
      })
    },
    [router],
  )

  const handleCurrentPageChange = useCallback(
    (newPage: number | string) => {
      setCurrentPage(newPage)
      updateQueryParams('currentPage', newPage as string)
    },
    [updateQueryParams],
  )

  const handleFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setFilter(e.target.value)
      updateQueryParams('filter', e.target.value)
    },
    [updateQueryParams],
  )

  const handleTaskOnChange = useCallback(
    (task: string) => {
      setSelectedTask(task)
      updateQueryParams('task', task)
    },
    [updateQueryParams],
  )

  const handleLibrariesOnChange = useCallback(
    (libraries: string[]) => {
      setSelectedLibraries(libraries as string[])
      updateQueryParams('libraries', libraries)
    },
    [updateQueryParams],
  )

  const onFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleResetFilters = () => {
    setSelectedTask('')
    setSelectedLibraries([])
    setFilter('')
    router.replace('/', undefined, { shallow: true })
  }

  return (
    <>
      <Title text='Marketplace' />
      <Container maxWidth='xl'>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Stack spacing={2} sx={{ maxWidth: '250px' }}>
            <Button component={Link} href='/entry/new' variant='contained'>
              Create
            </Button>
            <FormControl
              sx={{
                display: 'flex',
                alignItems: 'center',
                maxWidth: '400px',
                marginBottom: 3,
              }}
              variant='filled'
              onSubmit={onFilterSubmit}
            >
              <InputLabel htmlFor='entry-filter-input'>Search</InputLabel>
              <FilledInput
                sx={{ flex: 1, backgroundColor: theme.palette.background.paper, borderRadius: 2 }}
                id='entry-filter-input'
                value={filter}
                disableUnderline
                onChange={handleFilterChange}
                endAdornment={
                  <InputAdornment position='end'>
                    <IconButton color='secondary' type='submit' sx={{ p: '10px' }} aria-label='filter'>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
            <Box>
              <ChipSelector
                label='Tasks'
                chipTooltipTitle={'Filter by task'}
                // TODO fetch all model tags
                options={[
                  'Translation',
                  'Image Classification',
                  'Summarization',
                  'Tokenisation',
                  'Text to Speech',
                  'Tabular Regression',
                ]}
                expandThreshold={10}
                selectedChips={selectedTask}
                onChange={handleTaskOnChange}
                size='small'
                ariaLabel='add task to search filter'
              />
            </Box>
            <Box>
              <ChipSelector
                label='Libraries'
                chipTooltipTitle={'Filter by library'}
                // TODO fetch all model libraries
                options={['PyTorch', 'TensorFlow', 'JAX', 'Transformers', 'ONNX', 'Safetensors', 'spaCy']}
                expandThreshold={10}
                multiple
                selectedChips={selectedLibraries}
                onChange={handleLibrariesOnChange}
                size='small'
                ariaLabel='add library to search filter'
              />
            </Box>
            <Box>
              <ChipSelector
                label='Other'
                multiple
                options={[...searchFilterTypeLabels.map((type) => type.label)]}
                onChange={handleSelectedTypesOnChange}
                selectedChips={searchFilterTypeLabels
                  .filter((label) => selectedTypes.includes(label.key))
                  .map((type) => type.label)}
                size='small'
              />
            </Box>
            <Button onClick={handleResetFilters}>Reset filters</Button>
          </Stack>
          <Box sx={{ overflow: 'hidden', width: '100%' }}>
            <Paper sx={{ py: 2, px: 4 }}>
              <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} data-test='indexPageTabs'>
                <Tabs value={selectedTab} indicatorColor='secondary'>
                  <Tab
                    label={`Models ${models ? `(${models.length})` : ''}`}
                    value={EntryKind.MODEL}
                    onClick={() => setSelectedTab(EntryKind.MODEL)}
                  />
                  <Tab
                    label={`Data Cards ${dataCards ? `(${dataCards.length})` : ''}`}
                    value={EntryKind.DATA_CARD}
                    onClick={() => setSelectedTab(EntryKind.DATA_CARD)}
                  />
                </Tabs>
              </Box>
              {isModelsLoading && <Loading />}
              <Stack spacing={2}>
                <PaginationSelector
                  currentPage={currentPage}
                  onChange={(newValue) => handleCurrentPageChange(newValue)}
                  totalEntries={totalModels}
                />
                {!isModelsLoading && selectedTab === EntryKind.MODEL && (
                  <div data-test='modelListBox'>
                    <EntryList
                      entries={models}
                      entriesErrorMessage={isModelsError ? isModelsError.info.message : ''}
                      selectedChips={selectedLibraries}
                      onSelectedChipsChange={handleLibrariesOnChange}
                    />
                  </div>
                )}
                {!isDataCardsLoading && selectedTab === EntryKind.DATA_CARD && (
                  <div data-test='dataCardListBox'>
                    <EntryList
                      entries={dataCards}
                      entriesErrorMessage={isDataCardsError ? isDataCardsError.info.message : ''}
                      selectedChips={selectedLibraries}
                      onSelectedChipsChange={handleLibrariesOnChange}
                    />
                  </div>
                )}
                <PaginationSelector
                  currentPage={currentPage}
                  onChange={(newValue) => handleCurrentPageChange(newValue)}
                  totalEntries={totalModels}
                />
              </Stack>
            </Paper>
          </Box>
        </Stack>
      </Container>
    </>
  )
}
