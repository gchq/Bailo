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
  Typography,
} from '@mui/material/'
import { useTheme } from '@mui/material/styles'
import { useGetAllModelReviewRoles, useListModels } from 'actions/model'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ChangeEvent, useCallback, useEffect, useState } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import HelpDialog from 'src/common/HelpDialog'
import Loading from 'src/common/Loading'
import SearchInfo from 'src/common/SearchInfo'
import Title from 'src/common/Title'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import useDebounce from 'src/hooks/useDebounce'
import EntryList from 'src/marketplace/EntryList'
import { EntryKind, EntryKindKeys } from 'types/types'

interface KeyAndLabel {
  key: string
  label: string
}

const defaultRoleOptions: KeyAndLabel[] = [{ key: 'mine', label: 'Any role' }]

export default function Marketplace() {
  // TODO - fetch model tags from API
  const [filter, setFilter] = useState('')
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([])
  const [selectedTask, setSelectedTask] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [roleOptions, setRoleOptions] = useState<KeyAndLabel[]>(defaultRoleOptions)
  const [selectedTab, setSelectedTab] = useState<EntryKindKeys>(EntryKind.MODEL)
  const debouncedFilter = useDebounce(filter, 250)

  const { models, isModelsError, isModelsLoading } = useListModels(
    EntryKind.MODEL,
    selectedRoles,
    selectedTask,
    selectedLibraries,
    debouncedFilter,
  )

  const {
    models: dataCards,
    isModelsError: isDataCardsError,
    isModelsLoading: isDataCardsLoading,
  } = useListModels(EntryKind.DATA_CARD, selectedRoles, selectedTask, selectedLibraries, debouncedFilter)

  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetAllModelReviewRoles()

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

  const handleSelectedRolesOnChange = useCallback(
    (selectedFilters: string[]) => {
      if (selectedFilters.length > 0) {
        const filters: string[] = []
        selectedFilters.forEach((selectedFilter) => {
          const roleFilter = roleOptions.find((roleOption) => roleOption.label === selectedFilter)
          if (roleFilter) {
            filters.push(roleFilter.key)
          }
        })
        setSelectedRoles(filters)
      } else {
        setSelectedRoles([])
      }
    },
    [roleOptions],
  )

  const updateQueryParams = useCallback(
    (key: string, value: string | string[]) => {
      router.replace({
        query: { ...router.query, [key]: value },
      })
    },
    [router],
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

  useEffect(() => {
    if (modelRoles) {
      setRoleOptions([
        ...defaultRoleOptions,
        ...modelRoles.map((role) => {
          return { key: role.id, label: `${role.short}` }
        }),
      ])
    }
  }, [modelRoles])

  if (isModelRolesError) {
    return <ErrorWrapper message={isModelRolesError.info.message} />
  }

  if (isModelRolesLoading) {
    return <Loading />
  }

  return (
    <>
      <Title text='Marketplace' />
      <Container maxWidth='xl'>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Stack spacing={2} sx={{ maxWidth: '300px' }}>
            <Button component={Link} href='/entry/new' variant='contained'>
              Create
            </Button>
            <Container sx={{ backgroundColor: 'lightgray', py: 2, borderRadius: '8px' }}>
              <Stack direction='row' spacing={0.5} marginBottom='10px' justifyContent={'center'}>
                <Typography variant='h5' fontWeight='bold'>
                  Filters
                </Typography>
                <HelpDialog title='Search Info' content={<SearchInfo />} />
              </Stack>
              <FormControl
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  maxWidth: '400px',
                  mb: 3,
                  marginY: '10px',
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
                      <IconButton color='secondary' type='submit' sx={{ p: 2 }} aria-label='filter'>
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
                  label='My Roles'
                  multiple
                  options={roleOptions.map((role) => role.label)}
                  onChange={handleSelectedRolesOnChange}
                  selectedChips={roleOptions
                    .filter((label) => selectedRoles.includes(label.key))
                    .map((type) => type.label)}
                  size='small'
                />
              </Box>
              <Button onClick={handleResetFilters}>Reset filters</Button>
            </Container>
          </Stack>
          <Box sx={{ overflow: 'hidden', width: '100%' }}>
            <Paper>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }} data-test='indexPageTabs'>
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
            </Paper>
          </Box>
        </Stack>
      </Container>
    </>
  )
}
