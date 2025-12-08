import { ExpandMore } from '@mui/icons-material'
import SubjectIcon from '@mui/icons-material/Subject'
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
  InputLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material'
import { grey } from '@mui/material/colors'
import { useTheme } from '@mui/material/styles'
import { useGetPopularEntryTags, useListModels } from 'actions/model'
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
import { isEnabled, isReachable } from 'utils/peerUtils'

interface KeyAndLabel {
  key: string
  label: string
}

const defaultRoleOptions: KeyAndLabel[] = [{ key: 'mine', label: 'Any role' }]

export default function Marketplace() {
  const [filter, setFilter] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedPeers, setSelectedPeers] = useState<string[]>([])
  const [selectedOrganisations, setSelectedOrganisations] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [roleOptions, setRoleOptions] = useState<KeyAndLabel[]>(defaultRoleOptions)
  const [selectedTab, setSelectedTab] = useState<EntryKindKeys>(EntryKind.MODEL)
  const [mirroredModelsOnly, setMirroredModelsOnly] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [titleOnly, setTitleOnly] = useState(false)
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
    '',
    selectedTags,
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    debouncedFilter.length >= 3 ? debouncedFilter : '',
    false,
    '',
    titleOnly,
  )

  const {
    models: dataCards,
    errors: dataCardsErrors,
    isModelsError: isDataCardsError,
    isModelsLoading: isDataCardsLoading,
  } = useListModels(
    EntryKind.DATA_CARD,
    selectedRoles,
    '',
    [],
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    debouncedFilter.length >= 3 ? debouncedFilter : '',
    false,
    '',
    titleOnly,
  )

  const {
    models: mirroredModels,
    isModelsError: isMirroredModelsError,
    isModelsLoading: isMirroredModelsLoading,
  } = useListModels(
    EntryKind.MIRRORED_MODEL,
    selectedRoles,
    '',
    selectedTags,
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    debouncedFilter.length >= 3 ? debouncedFilter : '',
    false,
    '',
    titleOnly,
  )

  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles()
  const { tags, isTagsLoading, isTagsError } = useGetPopularEntryTags()

  const theme = useTheme()
  const router = useRouter()

  const {
    filter: filterFromQuery,
    task: taskFromQuery,
    peers: peersFromQuery,
    organisations: organisationsFromQuery,
    states: statesFromQuery,
    tags: tagsFromQuery,
    titleOnly: titleOnlyFromQuery,
  } = router.query

  useEffect(() => {
    if (filterFromQuery) setFilter(filterFromQuery as string)
    if (tagsFromQuery) {
      let tagsAsArray: string[] = []
      if (typeof tagsFromQuery === 'string') {
        tagsAsArray.push(tagsFromQuery)
      } else {
        tagsAsArray = [...tagsFromQuery]
      }
      setSelectedTags([...tagsAsArray])
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
    setTitleOnly(titleOnlyFromQuery === 'true')
  }, [
    filterFromQuery,
    taskFromQuery,
    tagsFromQuery,
    organisationsFromQuery,
    statesFromQuery,
    peersFromQuery,
    titleOnlyFromQuery,
  ])

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

  const unreachablePeerList: string[] = useMemo(() => {
    if (!peers) return []
    return Array.from(peers.entries())
      .filter(([_key, value]) => isEnabled(value) && !isReachable(value))
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

  const handlePopularTagsOnChange = useCallback(
    (selectedTags: string[]) => {
      setSelectedTags(selectedTags as string[])
      updateQueryParams('tags', selectedTags)
    },
    [updateQueryParams],
  )

  const onFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleChangeTitleOnly = useCallback(() => {
    setTitleOnly(!titleOnly)
    updateQueryParams('titleOnly', (!titleOnly).toString())
  }, [updateQueryParams, titleOnly])

  const handleResetFilters = () => {
    setSelectedOrganisations([])
    setSelectedTags([])
    setSelectedStates([])
    setSelectedRoles([])
    setSelectedPeers([])
    setFilter('')
    setTitleOnly(false)
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

  if (isReviewRolesLoading || isUiConfigLoading || isTagsLoading || isPeersLoading || isStatusLoading) {
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

  if (isTagsError) {
    return <ErrorWrapper message={isTagsError.info.message} />
  }

  // Only show peer/sources when not actively disabled
  const federationEnabled = 'disabled' != status?.federation?.state

  return (
    <>
      <Title text='Marketplace' />
      <Container maxWidth='xl'>
        <Stack direction={{ sm: 'column', md: 'row' }} spacing={2}>
          <Stack spacing={2} sx={{ maxWidth: { sm: '100%', md: '300px' } }}>
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
                  maxWidth: { sm: 'unset', md: '400px' },
                  mb: 3,
                  my: 2,
                }}
                variant='filled'
                onSubmit={onFilterSubmit}
              >
                <InputLabel htmlFor='entry-filter-input'>
                  {titleOnly ? 'Search by title (partial)' : 'Search by full text (exact)'}
                </InputLabel>
                <FilledInput
                  sx={{ flex: 1, backgroundColor: theme.palette.background.paper, borderRadius: 2, width: '100%' }}
                  id='entry-filter-input'
                  value={filter}
                  disableUnderline
                  inputProps={{ spellCheck: 'false' }}
                  onChange={handleFilterChange}
                  endAdornment={
                    <Tooltip title='Full Text'>
                      <IconButton
                        aria-label='titleOnly'
                        onClick={handleChangeTitleOnly}
                        color={titleOnly ? 'primary' : 'secondary'}
                      >
                        <SubjectIcon />
                      </IconButton>
                    </Tooltip>
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
                {federationEnabled && peers && Array.from(peers.keys()).length > 0 && (
                  <Box>
                    <ChipSelector
                      label='External Repositories'
                      chipTooltipTitle={'Include external repostories'}
                      options={Array.from(peers.keys())}
                      unreachableOptions={unreachablePeerList}
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
                    label='Popular Tags'
                    chipTooltipTitle={'Filter by frequently used tags'}
                    options={tags}
                    expandThreshold={10}
                    multiple
                    selectedChips={selectedTags}
                    onChange={handlePopularTagsOnChange}
                    size='small'
                    ariaLabel='add tag to search filter'
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
                <Tabs
                  value={selectedTab}
                  indicatorColor='secondary'
                  allowScrollButtonsMobile
                  scrollButtons='auto'
                  variant='scrollable'
                >
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
              {(isModelsLoading || isMirroredModelsLoading) && <Loading />}
              {modelsErrors && MultipleErrorWrapper('Error with model search', modelsErrors)}
              {!isModelsLoading && selectedTab === EntryKind.MODEL && (
                <div data-test='modelListBox'>
                  <EntryList
                    entries={mirroredModelsOnly ? mirroredModels : [...models, ...mirroredModels]}
                    entriesErrorMessage={combinedModelErrorMessage || ''}
                    selectedChips={selectedTags}
                    onSelectedChipsChange={handlePopularTagsOnChange}
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
                    selectedChips={selectedTags}
                    onSelectedChipsChange={handlePopularTagsOnChange}
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
