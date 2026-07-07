import Add from '@mui/icons-material/Add'
import RestartAlt from '@mui/icons-material/RestartAlt'
import SubjectIcon from '@mui/icons-material/Subject'
import TitleIcon from '@mui/icons-material/Title'
import {
  Box,
  Button,
  Container,
  Divider,
  FilledInput,
  FormControl,
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
import { useGetPopularEntryTags, useListEntries } from 'actions/entry'
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
import { toKebabCase, toTitleCase } from 'utils/stringUtils'

interface KeyAndLabel {
  key: string
  label: string
}

const defaultRoleOptions: KeyAndLabel[] = [{ key: 'mine', label: 'Any role' }]
const ALL_KINDS = 'All'

export default function Marketplace() {
  const router = useRouter()

  function parseQueryArray(value?: string | string[]): string[] {
    if (!value) {
      return []
    }
    return Array.isArray(value) ? [...value] : [value]
  }

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { peers, isPeersLoading, isPeersError } = useGetPeers()
  const { status, isStatusLoading, isStatusError } = useGetStatus()

  const isMirroredModelEnabled = !!uiConfig?.modelMirror.import.enabled
  const isUntrustedModelEnabled = !!uiConfig?.untrustedModel.enabled

  const [availableModelKinds, setAvailableModelKinds] = useState<EntryKindKeys[]>([])
  const [selectedKinds, setSelectedKinds] = useState<EntryKindKeys[]>([])
  const [filter, setFilter] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedPeers, setSelectedPeers] = useState<string[]>([])
  const [selectedOrganisations, setSelectedOrganisations] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState<EntryKindKeys>(EntryKind.MODEL)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [titleOnly, setTitleOnly] = useState(false)

  useEffect(() => {
    if (!router.isReady) {
      return
    }
    const {
      filter: filterFromQuery,
      peers: peersFromQuery,
      organisations: organisationsFromQuery,
      states: statesFromQuery,
      tags: tagsFromQuery,
      titleOnly: titleOnlyFromQuery,
      kinds: kindsFromQuery,
    } = router.query

    setFilter((filterFromQuery as string) || '')
    setSelectedPeers(parseQueryArray(peersFromQuery))
    setSelectedOrganisations(parseQueryArray(organisationsFromQuery))
    setSelectedStates(parseQueryArray(statesFromQuery))
    setSelectedTags(parseQueryArray(tagsFromQuery))
    setTitleOnly(titleOnlyFromQuery === 'true')
    if (kindsFromQuery) {
      setSelectedKinds(parseQueryArray(kindsFromQuery) as EntryKindKeys[])
    }
  }, [router.isReady, router.query, availableModelKinds])

  useEffect(() => {
    const kinds: EntryKindKeys[] = [EntryKind.MODEL]
    if (isMirroredModelEnabled) {
      kinds.push(EntryKind.MIRRORED_MODEL)
    }
    if (isUntrustedModelEnabled) {
      kinds.push(EntryKind.UNTRUSTED_MODEL)
    }
    setAvailableModelKinds(kinds)
    setSelectedKinds(kinds)
  }, [isMirroredModelEnabled, isUntrustedModelEnabled])

  const debouncedFilter = useDebounce(filter, 250)

  const searchFilter = debouncedFilter.length >= 3 ? debouncedFilter : ''

  const {
    entries: models,
    entryErrors: modelsErrors,
    isEntriesError: isModelsError,
    isEntriesLoading: isModelsLoading,
  } = useListEntries(
    EntryKind.MODEL,
    selectedRoles,
    '',
    selectedTags,
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    searchFilter,
    false,
    '',
    titleOnly,
  )

  const {
    entries: dataCards,
    entryErrors: dataCardsErrors,
    isEntriesError: isDataCardsError,
    isEntriesLoading: isDataCardsLoading,
  } = useListEntries(
    EntryKind.DATA_CARD,
    selectedRoles,
    '',
    [],
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    searchFilter,
    false,
    '',
    titleOnly,
  )

  const {
    entries: mirroredModels,
    isEntriesError: isMirroredModelsError,
    isEntriesLoading: isMirroredModelsLoading,
  } = useListEntries(
    EntryKind.MIRRORED_MODEL,
    selectedRoles,
    '',
    selectedTags,
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    searchFilter,
    false,
    '',
    titleOnly,
  )

  const {
    entries: untrustedModels,
    isEntriesError: isUntrustedModelsError,
    isEntriesLoading: isUntrustedModelsLoading,
  } = useListEntries(
    EntryKind.UNTRUSTED_MODEL,
    selectedRoles,
    '',
    selectedTags,
    selectedOrganisations,
    selectedStates,
    selectedPeers,
    searchFilter,
    false,
    '',
    titleOnly,
  )

  const { reviewRoles, isReviewRolesLoading, isReviewRolesError } = useGetReviewRoles()
  const { tags, isTagsLoading, isTagsError } = useGetPopularEntryTags()

  const roleOptions = useMemo(() => {
    return [
      ...defaultRoleOptions,
      ...reviewRoles.map((role) => {
        return { key: role.shortName, label: `${role.name}` }
      }),
    ]
  }, [reviewRoles])

  const theme = useTheme()

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
    if (!peers) {
      return []
    }
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

  const modelKindOptions = useMemo((): string[] => {
    if (availableModelKinds.length <= 1) {
      return availableModelKinds.map(toTitleCase)
    }
    return [ALL_KINDS, ...availableModelKinds.map(toTitleCase)]
  }, [availableModelKinds])

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

  const handleModelKindsOnChange = useCallback(
    (kinds: string[]) => {
      const wasAllSelected = selectedKinds.length === availableModelKinds.length
      const isAllNowSelected = kinds.includes(ALL_KINDS)
      if (isAllNowSelected && !wasAllSelected) {
        setSelectedKinds(availableModelKinds)
        updateQueryParams('kinds', availableModelKinds)
      } else if (!isAllNowSelected && wasAllSelected) {
        setSelectedKinds([])
        updateQueryParams('kinds', [])
      } else {
        const filteredKinds = kinds.filter((kind) => kind !== ALL_KINDS).map(toKebabCase) as EntryKindKeys[]
        setSelectedKinds(filteredKinds)
        updateQueryParams('kinds', filteredKinds)
      }
    },
    [updateQueryParams, selectedKinds, availableModelKinds],
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

  const handleResetFilters = useCallback(() => {
    setSelectedOrganisations([])
    setSelectedTags([])
    setSelectedStates([])
    setSelectedRoles([])
    setSelectedPeers([])
    setFilter('')
    setTitleOnly(false)
    setSelectedKinds(availableModelKinds)
    router.replace('/', undefined, { shallow: true })
  }, [availableModelKinds, router])

  const filteredModels = useMemo(() => {
    return [
      ...(selectedKinds.includes(EntryKind.MODEL) ? models : []),
      ...(availableModelKinds.includes(EntryKind.MIRRORED_MODEL) && selectedKinds.includes(EntryKind.MIRRORED_MODEL)
        ? mirroredModels
        : []),
      ...(availableModelKinds.includes(EntryKind.UNTRUSTED_MODEL) && selectedKinds.includes(EntryKind.UNTRUSTED_MODEL)
        ? untrustedModels
        : []),
    ]
  }, [models, mirroredModels, untrustedModels, selectedKinds, availableModelKinds])

  const combinedModelErrorMessage = useMemo(() => {
    let errorMessage = ''
    if (isModelsError) {
      errorMessage += `${isModelsError.info.message}. `
    }
    if (isMirroredModelsError) {
      errorMessage += `${isMirroredModelsError.info.message}. `
    }
    if (isUntrustedModelsError) {
      errorMessage += `${isUntrustedModelsError.info.message}. `
    }
    return errorMessage
  }, [isMirroredModelsError, isModelsError, isUntrustedModelsError])

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
            <Button component={Link} href='/entry/new' variant='contained' startIcon={<Add />}>
              Create
            </Button>
            <Container sx={{ backgroundColor: grey[200], py: 2, borderRadius: '8px' }}>
              <Stack direction='row' spacing={0.5} sx={{ justifyContent: 'left', alignItems: 'center', mb: 2 }}>
                <Typography component='h2' variant='h5' sx={{ fontWeight: 'bold' }}>
                  Filters
                </Typography>
                <HelpDialog title='Search Information' content={<SearchInfo />} />
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
                  {titleOnly ? 'Search by name' : 'Search by full text'}
                </InputLabel>
                <FilledInput
                  sx={{ flex: 1, backgroundColor: theme.palette.background.paper, borderRadius: 2, width: '100%' }}
                  id='entry-filter-input'
                  value={filter}
                  disableUnderline
                  inputProps={{ spellCheck: 'false' }}
                  onChange={handleFilterChange}
                  endAdornment={
                    <Tooltip title={titleOnly ? 'Name' : 'Full Text'}>
                      <IconButton aria-label='titleOnly' onClick={handleChangeTitleOnly} color='primary'>
                        {titleOnly ? <TitleIcon /> : <SubjectIcon />}
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
              <Stack divider={<Divider flexItem />} spacing={0}>
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
                      label='External repositories'
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
                    label='Popular tags'
                    subheading='(top 10)'
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
                {uiConfig && selectedTab !== EntryKind.DATA_CARD && availableModelKinds.length > 1 && (
                  <Box>
                    <ChipSelector
                      label='Model Kinds'
                      chipTooltipTitle={'Filter by model kinds'}
                      options={modelKindOptions}
                      expandThreshold={10}
                      multiple
                      selectedChips={
                        selectedKinds.length === availableModelKinds.length
                          ? [ALL_KINDS, ...selectedKinds.map(toTitleCase)]
                          : selectedKinds.map(toTitleCase)
                      }
                      onChange={handleModelKindsOnChange}
                      size='small'
                      ariaLabel='add model kind to search filter'
                      accordion
                    />
                  </Box>
                )}
                <Box>
                  <ChipSelector
                    label='My roles'
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
              <Box
                sx={{
                  justifySelf: 'center',
                  marginTop: 1,
                }}
              >
                <Button onClick={handleResetFilters} startIcon={<RestartAlt />}>
                  Reset filters
                </Button>
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
                    label={`Models ${models ? `(${filteredModels.length})` : ''}`}
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
              {(isModelsLoading ||
                (isMirroredModelEnabled && isMirroredModelsLoading) ||
                (isUntrustedModelEnabled && isUntrustedModelsLoading)) && <Loading />}
              {modelsErrors && MultipleErrorWrapper('Error with model search', modelsErrors)}
              {!isModelsLoading && selectedTab === EntryKind.MODEL && (
                <div data-test='modelListBox'>
                  <EntryList
                    entries={filteredModels}
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
                    displayPeers={federationEnabled}
                    peers={peers}
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
