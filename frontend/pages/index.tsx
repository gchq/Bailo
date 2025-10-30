import { ExpandMore } from '@mui/icons-material'
import SearchIcon from '@mui/icons-material/Search'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FilledInput,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  InputLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material/'
import { grey } from '@mui/material/colors'
import { useTheme } from '@mui/material/styles'
import { useListModels } from 'actions/model'
import { useGetReviewRoles } from 'actions/reviewRoles'
import { useGetPeers, useGetStatus } from 'actions/system'
import { useGetUiConfig } from 'actions/uiConfig'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import ChipSelector from 'src/common/ChipSelector'
import HelpDialog from 'src/common/HelpDialog'
import Loading from 'src/common/Loading'
import SearchInfo from 'src/common/SearchInfo'
import Title from 'src/common/Title'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import useDebounce from 'src/hooks/useDebounce'
import EntryList from 'src/marketplace/EntryList'
import { EntryKind, EntryKindKeys } from 'types/types'
import { isReachable } from 'utils/peerUtils'

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
  const [selectedPeers, setSelectedPeers] = useState<string[]>([])
  const [selectedOrganisations, setSelectedOrganisations] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [roleOptions, setRoleOptions] = useState<KeyAndLabel[]>(defaultRoleOptions)
  const [selectedTab, setSelectedTab] = useState<EntryKindKeys>(EntryKind.MODEL)
  const [mirroredModelsOnly, setMirroredModelsOnly] = useState(false)
  const debouncedFilter = useDebounce(filter, 250)

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { peers, isPeersLoading, isPeersError } = useGetPeers()
  const { status, isStatusLoading, isStatusError } = useGetStatus()

  const {
    models,
    errors: modelsErrors,
    isModelsError,
    isModelsLoading,
  } = useListModels(
    EntryKind.MODEL,
    selectedRoles,
    selectedTask,
    selectedLibraries,
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    debouncedFilter.length >= 3 ? debouncedFilter : '',
  )

  const {
    models: dataCards,
    errors: dataCardsErrors,
    isModelsError: isDataCardsError,
    isModelsLoading: isDataCardsLoading,
  } = useListModels(
    EntryKind.DATA_CARD,
    selectedRoles,
    selectedTask,
    selectedLibraries,
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    debouncedFilter.length >= 3 ? debouncedFilter : '',
  )

  const {
    models: mirroredModels,
    isModelsError: isMirroredModelsError,
    isModelsLoading: isMirroredModelsLoading,
  } = useListModels(
    EntryKind.MIRRORED_MODEL,
    selectedRoles,
    selectedTask,
    selectedLibraries,
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    debouncedFilter.length >= 3 ? debouncedFilter : '',
  )

  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles()

  const theme = useTheme()
  const router = useRouter()

  const {
    filter: filterFromQuery,
    task: taskFromQuery,
    libraries: librariesFromQuery,
    peers: peersFromQuery,
    organisations: organisationsFromQuery,
    states: statesFromQuery,
  } = router.query

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
    if (organisationsFromQuery) {
      let organisationsAsArray: string[] = []
      if (typeof organisationsFromQuery === 'string') {
        organisationsAsArray.push(organisationsFromQuery)
      } else {
        organisationsAsArray = [...organisationsFromQuery]
      }
      setSelectedOrganisations([...organisationsAsArray])
    }
    if (statesFromQuery) {
      let statesAsArray: string[] = []
      if (typeof statesFromQuery === 'string') {
        statesAsArray.push(statesFromQuery)
      } else {
        statesAsArray = [...statesFromQuery]
      }
      setSelectedStates([...statesAsArray])
    }
    if (peersFromQuery) {
      let peersAsArray: string[] = []
      if (typeof peersFromQuery === 'string') {
        peersAsArray.push(peersFromQuery)
      } else {
        peersAsArray = [...peersFromQuery]
      }
      setSelectedPeers([...peersAsArray])
    }
  }, [filterFromQuery, taskFromQuery, librariesFromQuery, organisationsFromQuery, statesFromQuery, peersFromQuery])

  const updateQueryParams = useCallback(
    (key: string, value: string | string[]) => {
      router.replace({
        query: { ...router.query, [key]: value },
      })
    },
    [router],
  )

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

  const reachablePeerList = useMemo(() => {
    if (!peers) return []
    return Array.from(peers.entries())
      .filter(([, value]) => isReachable(value))
      .map(([key]) => key)
  }, [peers])

  const organisationList = useMemo(() => {
    return uiConfig ? uiConfig.modelDetails.organisations.map((organisationItem) => organisationItem) : []
  }, [uiConfig])

  const stateList = useMemo(() => {
    return uiConfig ? uiConfig.modelDetails.states.map((stateItem) => stateItem) : []
  }, [uiConfig])

  const handleFilterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setFilter(e.target.value)
      updateQueryParams('filter', e.target.value)
    },
    [updateQueryParams],
  )

  const handlePeersOnChange = useCallback(
    (peers: string[]) => {
      setSelectedPeers(peers)
      updateQueryParams('peers', peers)
    },
    [updateQueryParams],
  )

  const handleOrganisationsOnChange = useCallback(
    (organisations: string[]) => {
      setSelectedOrganisations(organisations)
      updateQueryParams('organisations', organisations)
    },
    [updateQueryParams],
  )

  const handleStatesOnChange = useCallback(
    (states: string[]) => {
      setSelectedStates(states)
      updateQueryParams('states', states)
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
    setSelectedOrganisations([])
    setSelectedStates([])
    setSelectedRoles([])
    setSelectedPeers([])
    setFilter('')
    router.replace('/', undefined, { shallow: true })
  }

  const combinedModelErrorMessage = useMemo(() => {
    let errorMessage = ''
    if (isModelsError) {
      errorMessage += `${isModelsError.info.message}. `
    }
    if (isMirroredModelsError) {
      errorMessage += `${isMirroredModelsError.info.message}. `
    }
    return errorMessage
  }, [isMirroredModelsError, isModelsError])

  useEffect(() => {
    if (reviewRoles) {
      setRoleOptions([
        ...defaultRoleOptions,
        ...reviewRoles.map((role) => {
          return { key: role.shortName, label: `${role.name}` }
        }),
      ])
    }
  }, [reviewRoles])

  if (isUiConfigLoading || isReviewRolesLoading || isPeersLoading || isStatusLoading) {
    return <Loading />
  }

  if (isPeersError) {
    return <ErrorWrapper message={isPeersError.info.message} />
  }

  if (isStatusError) {
    return <ErrorWrapper message={isStatusError.info.message} />
  }

  if (isReviewRolesError) {
    return <ErrorWrapper message={isReviewRolesError.info.message} />
  }

  if (isUiConfigError) {
    return <ErrorWrapper message={isUiConfigError.info.message} />
  }

  // Only show peer/sources when not actively disabled
  const federationEnabled = 'disabled' != status?.federation?.state

  return (
    <>
      <Title text='Marketplace' />
      <Container maxWidth='xl'>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Stack spacing={2} sx={{ maxWidth: '300px' }}>
            <Button component={Link} href='/entry/new' variant='contained'>
              Create
            </Button>
            <Container sx={{ backgroundColor: grey[200], py: 2, borderRadius: '8px' }}>
              <Stack direction='row' spacing={0.5} marginBottom={2} justifyContent='left'>
                <Typography component='h2' variant='h5' fontWeight='bold'>
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
                  my: 2,
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
                {debouncedFilter.length > 0 && debouncedFilter.length < 3 && (
                  <Typography variant='caption' color='error'>
                    Please enter at least three characters
                  </Typography>
                )}
              </FormControl>
              <Stack divider={<Divider flexItem />}>
                {uiConfig && uiConfig.modelDetails.organisations.length > 0 && (
                  <Box>
                    <ChipSelector
                      label='Organisations'
                      chipTooltipTitle={'Filter by organisation'}
                      options={organisationList}
                      expandThreshold={10}
                      multiple
                      selectedChips={selectedOrganisations}
                      onChange={handleOrganisationsOnChange}
                      size='small'
                      ariaLabel='add organisation to search filter'
                      accordion
                    />
                  </Box>
                )}
                {uiConfig && uiConfig.modelDetails.states.length > 0 && (
                  <Box>
                    <ChipSelector
                      label='States'
                      chipTooltipTitle={'Filter by state'}
                      options={stateList}
                      expandThreshold={10}
                      multiple
                      selectedChips={selectedStates}
                      onChange={handleStatesOnChange}
                      size='small'
                      ariaLabel='add state to search filter'
                      accordion
                    />
                  </Box>
                )}
                {federationEnabled && reachablePeerList && reachablePeerList.length > 0 && (
                  <Box>
                    <ChipSelector
                      label='External repos'
                      chipTooltipTitle={'Include external repostories'}
                      options={reachablePeerList}
                      expandThreshold={10}
                      multiple
                      selectedChips={selectedPeers}
                      onChange={handlePeersOnChange}
                      size='small'
                      ariaLabel='add external repository to search filter'
                      accordion
                    />
                  </Box>
                )}
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
                    accordion
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
                    accordion
                  />
                </Box>
                {mirroredModels.length > 0 && (
                  <Accordion disableGutters sx={{ backgroundColor: 'transparent' }}>
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 0 }}>
                      <Typography component='h2' variant='h6'>
                        Mirrored Models
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 1 }}>
                      <FormGroup>
                        <FormControlLabel
                          control={<Checkbox onChange={(e) => setMirroredModelsOnly(e.target.checked)} />}
                          label='Only display mirrored models'
                        />
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>
                )}
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
              </Stack>
              <Box justifySelf='center' marginTop={1}>
                <Button onClick={handleResetFilters}>Reset filters</Button>
              </Box>
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
              {isModelsLoading || (isMirroredModelsLoading && <Loading />)}
              {modelsErrors && MultipleErrorWrapper('Error with model search', modelsErrors)}
              {!isModelsLoading && selectedTab === EntryKind.MODEL && (
                <div data-test='modelListBox'>
                  <EntryList
                    entries={mirroredModelsOnly ? mirroredModels : [...models, ...mirroredModels]}
                    entriesErrorMessage={combinedModelErrorMessage || ''}
                    selectedChips={selectedLibraries}
                    onSelectedChipsChange={handleLibrariesOnChange}
                    selectedOrganisations={selectedOrganisations}
                    onSelectedOrganisationsChange={handleOrganisationsOnChange}
                    selectedStates={selectedStates}
                    onSelectedStatesChange={handleStatesOnChange}
                    selectedPeers={selectedPeers}
                    onSelectedPeersChange={handlePeersOnChange}
                    displayOrganisation={uiConfig && uiConfig.modelDetails.organisations.length > 0}
                    displayState={uiConfig && uiConfig.modelDetails.states.length > 0}
                    displayPeers={federationEnabled}
                    peers={peers}
                  />
                </div>
              )}
              {selectedTab === EntryKind.DATA_CARD &&
                dataCardsErrors &&
                MultipleErrorWrapper('Error with data-card search', dataCardsErrors)}
              {!isDataCardsLoading && selectedTab === EntryKind.DATA_CARD && (
                <div data-test='dataCardListBox'>
                  <EntryList
                    entries={dataCards}
                    entriesErrorMessage={isDataCardsError ? isDataCardsError.info.message : ''}
                    selectedChips={selectedLibraries}
                    onSelectedChipsChange={handleLibrariesOnChange}
                    selectedOrganisations={selectedOrganisations}
                    onSelectedOrganisationsChange={handleOrganisationsOnChange}
                    selectedStates={selectedStates}
                    onSelectedStatesChange={handleStatesOnChange}
                    selectedPeers={selectedPeers}
                    onSelectedPeersChange={handlePeersOnChange}
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
