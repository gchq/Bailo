import SubjectIcon from '@mui/icons-material/Subject'
import TitleIcon from '@mui/icons-material/Title'
import {
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  FilledInput,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Select,
  type SelectChangeEvent,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetPopularEntryTags, useListEntries } from 'actions/entry'
import { useGetReviewRoles } from 'actions/reviewRoles'
import { useGetPeers, useGetStatus } from 'actions/system'
import { useListEntities } from 'actions/user'
import _ from 'lodash'
import { debounce } from 'lodash-es'
import Image from 'next/image'
import { useRouter } from 'node_modules/next/router'
import { type ChangeEvent, type SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import LimitedTextField from 'src/common/LimitedTextField'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import UiConfigContext from 'src/contexts/uiConfigContext'
import ErrorWrapper from 'src/errors/ErrorWrapper'
import useDebounce from 'src/hooks/useDebounce'
import EntryCardList from 'src/marketplace/EntryCardList'
import { type EntityObject, EntryKind, type EntryKindKeys } from 'types/types'
import { fromEntity, toEntity } from 'utils/entityUtils'
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
  const theme = useTheme()

  function parseQueryArray(value?: string | string[]): string[] {
    if (!value) {
      return []
    }
    return Array.isArray(value) ? [...value] : [value]
  }

  const [userListQuery, setUserListQuery] = useState('')
  const { users, isUsersLoading, isUsersError } = useListEntities(userListQuery)

  const uiConfig = useContext(UiConfigContext)
  const { peers, isPeersLoading, isPeersError } = useGetPeers()
  const { status, isStatusLoading, isStatusError } = useGetStatus()

  const isMirroredModelEnabled = !!uiConfig.modelMirror.import.enabled
  const isUntrustedModelEnabled = !!uiConfig.untrustedModel.enabled

  const [updatedUsers, setUpdatedUsers] = useState<Array<EntityObject>>([])
  const [availableModelKinds, setAvailableModelKinds] = useState<EntryKindKeys[]>([])
  const [selectedKinds, setSelectedKinds] = useState<EntryKindKeys[]>([])
  const [filter, setFilter] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedPeers, setSelectedPeers] = useState<string[]>([])
  const [selectedOrganisations, setSelectedOrganisations] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [titleOnly, setTitleOnly] = useState(false)
  const [selectedTab, setSelectedTab] = useState<EntryKindKeys>(EntryKind.MODEL)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

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
      roles: rolesFromQuery,
      titleOnly: titleOnlyFromQuery,
      kinds: kindsFromQuery,
      users: usersFromQuery,
    } = router.query

    setFilter((filterFromQuery as string) || '')
    setSelectedPeers(parseQueryArray(peersFromQuery))
    setSelectedOrganisations(parseQueryArray(organisationsFromQuery))
    setSelectedStates(parseQueryArray(statesFromQuery))
    setSelectedTags(parseQueryArray(tagsFromQuery))
    setSelectedRoles(parseQueryArray(rolesFromQuery))
    setTitleOnly(titleOnlyFromQuery === 'true')
    setUpdatedUsers(parseQueryArray(usersFromQuery).map((user) => fromEntity(user)))
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

  const { entries, entryErrors, isEntriesError, isEntriesLoading } = useListEntries({
    kind: [EntryKind.MODEL, EntryKind.MIRRORED_MODEL, EntryKind.UNTRUSTED_MODEL, EntryKind.DATA_CARD],
    roles: selectedRoles,
    libraries: selectedTags,
    organisations: selectedOrganisations,
    states: selectedStates,
    peers: selectedPeers,
    search: searchFilter,
    users: updatedUsers.map((user) => toEntity(user.kind, user.id)),
    titleOnly,
  })

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
        updateQueryParams('roles', filters)
      } else {
        setSelectedRoles([])
        updateQueryParams('roles', [])
      }
    },
    [roleOptions, updateQueryParams],
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
    return uiConfig.modelDetails.organisations
  }, [uiConfig])

  const stateList = useMemo(() => {
    return uiConfig.modelDetails.states
  }, [uiConfig])

  const modelKindOptions = useMemo((): string[] => {
    if (availableModelKinds.length <= 1) {
      return availableModelKinds.map(toTitleCase)
    }
    return [ALL_KINDS, ...availableModelKinds.map(toTitleCase)]
  }, [availableModelKinds])

  const logoSrc = theme.palette.mode === 'dark' ? '/logo-horizontal-light.png' : '/horizontal-dark.png'

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

  const handleMultiSelectChange = useCallback(
    (event: SelectChangeEvent<string[]>, onChange: (values: string[]) => void) => {
      onChange(event.target.value as string[])
    },
    [],
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
    router.replace('/beta', undefined, { shallow: true })
  }, [availableModelKinds, router])

  const filteredModels = useMemo(() => {
    return [
      ...(selectedKinds.includes(EntryKind.MODEL) ? entries.filter((model) => model.kind === EntryKind.MODEL) : []),
      ...(availableModelKinds.includes(EntryKind.MIRRORED_MODEL) && selectedKinds.includes(EntryKind.MIRRORED_MODEL)
        ? entries.filter((model) => model.kind === EntryKind.MIRRORED_MODEL)
        : []),
      ...(availableModelKinds.includes(EntryKind.UNTRUSTED_MODEL) && selectedKinds.includes(EntryKind.UNTRUSTED_MODEL)
        ? entries.filter((model) => model.kind === EntryKind.UNTRUSTED_MODEL)
        : []),
    ]
  }, [entries, selectedKinds, availableModelKinds])

  const dataCards = useMemo(() => {
    return entries.filter((entry) => entry.kind === EntryKind.DATA_CARD)
  }, [entries])

  const combinedModelErrorMessage = useMemo(() => {
    let errorMessage = ''
    if (isEntriesError) {
      errorMessage += `${isEntriesError.info.message}. `
    }
    return errorMessage
  }, [isEntriesError])

  const debounceOnInputChange = debounce((_event: SyntheticEvent<Element, Event>, value: string) => {
    setUserListQuery(value)
  }, 500)

  if (isReviewRolesLoading || isTagsLoading || isPeersLoading || isStatusLoading) {
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

  if (isTagsError) {
    return <ErrorWrapper message={isTagsError.info.message} />
  }

  if (isUsersError) {
    return <ErrorWrapper message={isUsersError.info.message} />
  }

  // Only show peer/sources when not actively disabled
  const federationEnabled = 'disabled' != status?.federation?.state

  return (
    <Container maxWidth='xl'>
      <Title text='Marketplace' />
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Box sx={{ textAlign: 'center' }}>
            <Image src={logoSrc} alt='Bailo logo' height='140' width='350' />
          </Box>
          <FormControl
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              margin: 'auto',
            }}
            variant='filled'
            onSubmit={onFilterSubmit}
          >
            <InputLabel htmlFor='entry-filter-input'>{titleOnly ? 'Search by name' : 'Search by full text'}</InputLabel>
            <FilledInput
              sx={{
                flex: 1,
                borderRadius: 2,
                width: '100%',
              }}
              id='entry-filter-input'
              value={filter}
              disableUnderline
              title='lol'
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
          <Stack direction='row'>
            <Button onClick={(event) => setAnchorEl(event.currentTarget)}>Filters (0)</Button>
            <Button size='small' sx={{ width: 'max-content' }} onClick={handleResetFilters}>
              Reset filters
            </Button>
          </Stack>
          <Divider />
          <Stack spacing={2}>
            <ToggleButtonGroup
              value={selectedTab}
              color='primary'
              size='small'
              onChange={(_event, value) => {
                if (value) {
                  setSelectedTab(value)
                }
              }}
              aria-label='text formatting'
              exclusive
            >
              <ToggleButton value={EntryKind.MODEL} aria-label='bold' sx={{ px: 2 }}>
                Models
              </ToggleButton>
              <ToggleButton value={EntryKind.DATA_CARD} aria-label='italic' sx={{ px: 2 }}>
                Data cards
              </ToggleButton>
            </ToggleButtonGroup>
            <div data-test='modelListBox'>
              {!isEntriesLoading && selectedTab === EntryKind.MODEL && (
                <EntryCardList
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
                  displayOrganisation={uiConfig.modelDetails.organisations.length > 0}
                  displayState={uiConfig.modelDetails.states.length > 0}
                  displayPeers={federationEnabled}
                  peers={peers}
                />
              )}
              {!isEntriesLoading && selectedTab === EntryKind.DATA_CARD && (
                <EntryCardList
                  entries={dataCards}
                  entriesErrorMessage={entryErrors ? entryErrors.info.message : ''}
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
              )}
            </div>
          </Stack>
        </Stack>
      </Paper>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack spacing={1}>
            {organisationList.length > 0 && (
              <FormControl size='small' sx={{ minWidth: 160 }}>
                <InputLabel id='organisation-filter-label'>Organisation</InputLabel>
                <Select
                  labelId='organisation-filter-label'
                  multiple
                  value={selectedOrganisations}
                  label='Organisation'
                  onChange={(event) => handleMultiSelectChange(event, handleOrganisationsOnChange)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {organisationList.map((organisation) => (
                    <MenuItem key={organisation} value={organisation}>
                      {organisation}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel id='state-filter-label'>States</InputLabel>
              <Select
                labelId='state-filter-label'
                multiple
                value={selectedStates}
                label='States'
                onChange={(event) => handleMultiSelectChange(event, handleStatesOnChange)}
                renderValue={(selected) => selected.join(', ')}
              >
                {stateList.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedTab !== EntryKind.DATA_CARD && availableModelKinds.length > 1 && (
              <FormControl size='small' sx={{ minWidth: 160 }}>
                <InputLabel id='kind-filter-label'>Kinds</InputLabel>
                <Select
                  labelId='kind-filter-label'
                  multiple
                  value={selectedKinds.map(toTitleCase)}
                  label='Kinds'
                  onChange={(event) => handleMultiSelectChange(event, handleModelKindsOnChange)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {modelKindOptions.map((kind) => (
                    <MenuItem key={kind} value={kind}>
                      {kind}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {federationEnabled && peers && peers.size > 0 && (
              <FormControl size='small' sx={{ minWidth: 200 }}>
                <InputLabel id='peer-filter-label'>External repositories</InputLabel>
                <Select
                  labelId='peer-filter-label'
                  multiple
                  value={selectedPeers}
                  label='External repositories'
                  onChange={(event) => handleMultiSelectChange(event, handlePeersOnChange)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {Array.from(peers.keys()).map((peer) => (
                    <MenuItem key={peer} value={peer} disabled={unreachablePeerList.includes(peer)}>
                      {peer}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel id='tag-filter-label'>Popular tags</InputLabel>
              <Select
                labelId='tag-filter-label'
                multiple
                value={selectedTags}
                label='Popular tags'
                onChange={(event) => handleMultiSelectChange(event, handlePopularTagsOnChange)}
                renderValue={(selected) => selected.join(', ')}
              >
                {tags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size='small' sx={{ minWidth: 160 }}>
              <InputLabel id='role-filter-label'>My roles</InputLabel>
              <Select
                labelId='role-filter-label'
                multiple
                value={roleOptions.filter((role) => selectedRoles.includes(role.key)).map((role) => role.label)}
                label='My roles'
                onChange={(event) => handleSelectedRolesOnChange(event.target.value as string[])}
                renderValue={(selected) => selected.join(', ')}
              >
                {roleOptions.map((role) => (
                  <MenuItem key={role.key} value={role.label}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              multiple
              size='small'
              noOptionsText='No entries found'
              onInputChange={debounceOnInputChange}
              value={updatedUsers}
              groupBy={(option) => option.kind.toUpperCase()}
              getOptionLabel={(option) => option.id}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_event, newValue) => {
                setUpdatedUsers(newValue)
              }}
              options={users}
              filterOptions={(options) =>
                options.filter((option) => !updatedUsers.find((user) => _.isEqual(user, option)))
              }
              loading={isUsersLoading && userListQuery.length >= 3}
              sx={{ minWidth: '300px' }}
              renderInput={(params) => (
                <LimitedTextField
                  {...params}
                  autoFocus
                  label={'Search for user or group'}
                  slotProps={{ ...params.slotProps }}
                />
              )}
            />
            <Button size='small' sx={{ width: 'max-content' }} onClick={handleResetFilters}>
              Reset filters
            </Button>
          </Stack>
        </Box>
      </Popover>
    </Container>
  )
}
