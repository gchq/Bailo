import dayjs from '@dayjs'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { useGetModelBreakdown, useGetOverviewMetrics } from 'actions/metrics'
import { useGetSchemas } from 'actions/schema'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { FilterMenuButton } from 'src/common/FilterMenuButton'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { MetricsBreakdownTable } from 'src/metrics/components/MetricsBreakdownTable'
import MetricsHeader from 'src/metrics/components/MetricsHeader'
import { MonthlyUploadsSelector } from 'src/metrics/components/MonthlyUploadsSelector'
import { SystemRole } from 'types/types'
import { buildEntriesHref, dateFormat, EntriesFilterQuery, filterIncludeTypes } from 'utils/metricsUtils'

const ALL_VALUE = 'All'
const NONE_SCHEMA_VALUE = 'none'

function getQueryString(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : ALL_VALUE
}

export default function EntryMetrics() {
  const router = useRouter()

  const { overviewMetrics, isOverviewMetricsLoading, isOverviewMetricsError } = useGetOverviewMetrics()
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()

  // Filters are sourced directly from the URL so this view can be deep linked.
  const organisation = getQueryString(router.query.organisation)
  const state = getQueryString(router.query.state)
  const schemaId = getQueryString(router.query.schemaId)
  const release = getQueryString(router.query.release)
  const accessRequest = getQueryString(router.query.accessRequest)
  const startMonth = typeof router.query.startMonth === 'string' ? router.query.startMonth : undefined
  const endMonth = typeof router.query.endMonth === 'string' ? router.query.endMonth : undefined

  const { entries, isEntriesLoading, isEntriesError } = useGetModelBreakdown({
    organisation: organisation !== ALL_VALUE ? organisation : undefined,
    state: state !== ALL_VALUE ? state : undefined,
    schemaId: schemaId !== ALL_VALUE ? schemaId : undefined,
    release: release !== ALL_VALUE ? release : undefined,
    accessRequest: accessRequest !== ALL_VALUE ? accessRequest : undefined,
    startMonth,
    endMonth,
  })

  function getCurrentFilterQuery(): EntriesFilterQuery {
    return {
      organisation: organisation !== ALL_VALUE ? organisation : undefined,
      state: state !== ALL_VALUE ? state : undefined,
      schemaId: schemaId !== ALL_VALUE ? schemaId : undefined,
      release: release !== ALL_VALUE ? release : undefined,
      accessRequest: accessRequest !== ALL_VALUE ? accessRequest : undefined,
      startMonth,
      endMonth,
    }
  }

  function updateFilter(key: keyof EntriesFilterQuery, value: string) {
    const current = getCurrentFilterQuery()

    const next = {
      ...current,
      [key]: value === ALL_VALUE ? undefined : value,
    }

    router.push(buildEntriesHref(next), undefined, { shallow: true })
  }

  function updateMonthRange(start?: string, end?: string) {
    const current = getCurrentFilterQuery()

    const next: EntriesFilterQuery = {
      ...current,
      startMonth: start,
      endMonth: end,
    }

    router.push(buildEntriesHref(next), undefined, {
      shallow: true,
    })
  }

  const stateOptions = useMemo(
    () => [ALL_VALUE, ...(overviewMetrics?.global.entryState?.map((s) => s.state) ?? [])],
    [overviewMetrics],
  )

  const schemaOptions = useMemo(
    () => [
      { value: ALL_VALUE, label: ALL_VALUE },
      { value: NONE_SCHEMA_VALUE, label: 'None' },
      ...(schemas ?? []).map((schema) => ({ value: schema.id, label: schema.name })),
    ],
    [schemas],
  )

  const releaseOptions = [
    { value: ALL_VALUE, label: ALL_VALUE },
    { value: filterIncludeTypes.WITH, label: 'With releases' },
    { value: filterIncludeTypes.WITHOUT, label: 'Without releases' },
  ]

  const accessRequestOptions = [
    { value: ALL_VALUE, label: ALL_VALUE },
    { value: filterIncludeTypes.WITH, label: 'With access request' },
    { value: filterIncludeTypes.WITHOUT, label: 'Without access request' },
  ]

  const tableData = useMemo(
    () =>
      (entries ?? []).map((entry) => ({
        entryId: entry.entryId,
        entryName: entry.entryName,
        modelOwners:
          entry.collaborators
            ?.filter((person) => person.roles.includes(SystemRole.Owner))
            .map((person) => person.entity) ?? [],
      })),
    [entries],
  )

  const resultCountLabel = useMemo(() => {
    if (isEntriesLoading) {
      return 'Loading entries…'
    }
    if (isEntriesError) {
      return null
    }
    const count = tableData.length
    return `${count} ${count === 1 ? 'entry' : 'entries'}`
  }, [isEntriesLoading, isEntriesError, tableData.length])

  const handleClearFiltersOnClick = useCallback(() => {
    const current: EntriesFilterQuery = {
      organisation: organisation,
      state: undefined,
      schemaId: undefined,
      release: undefined,
      accessRequest: undefined,
      startMonth: undefined,
      endMonth: undefined,
    }
    router.push(buildEntriesHref(current), undefined, { shallow: true })
  }, [organisation, router])

  if (isOverviewMetricsError) {
    return <MessageAlert message={isOverviewMetricsError.info.message} />
  }

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} />
  }

  if (isOverviewMetricsLoading || isSchemasLoading) {
    return <Loading />
  }

  const isClearDisabled =
    state === ALL_VALUE &&
    schemaId === ALL_VALUE &&
    release === ALL_VALUE &&
    accessRequest === ALL_VALUE &&
    startMonth === undefined &&
    endMonth === undefined

  return (
    <Container maxWidth='lg' sx={{ mb: 4 }}>
      <Stack spacing={0.5} sx={{ mt: 2, mb: 4 }}>
        {overviewMetrics && (
          <MetricsHeader
            organisations={overviewMetrics.byOrganisation.map((organisationSubset) => organisationSubset.organisation)}
            lastUpdated={overviewMetrics.lastUpdated}
            onOrganisationChange={(value) => updateFilter('organisation', value)}
            selectedOrganisation={organisation}
            exportDocumentTitle='Bailo entry metrics'
            titleObjectType='entries'
          >
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                <Stack direction='row' spacing={1}>
                  <FilterMenuButton
                    label='State'
                    options={stateOptions.map((s) => ({ value: s, label: s }))}
                    selectedValue={state}
                    onSelect={(value) => updateFilter('state', value)}
                  />
                  <FilterMenuButton
                    label='Schema'
                    options={schemaOptions}
                    selectedValue={schemaId}
                    onSelect={(value) => updateFilter('schemaId', value)}
                  />
                  <FilterMenuButton
                    label='Release'
                    options={releaseOptions}
                    selectedValue={release}
                    onSelect={(value) => updateFilter('release', value)}
                  />
                  <FilterMenuButton
                    label='Access request'
                    options={accessRequestOptions}
                    selectedValue={accessRequest}
                    onSelect={(value) => updateFilter('accessRequest', value)}
                  />
                  <Button disabled={isClearDisabled} onClick={handleClearFiltersOnClick}>
                    Clear filters
                  </Button>
                </Stack>
              </Stack>
              <MonthlyUploadsSelector
                startDate={startMonth ? dayjs(startMonth) : null}
                endDate={endMonth ? dayjs(endMonth) : null}
                showTitle={false}
                onStartDateChange={(date) => updateMonthRange(date ? date.format(dateFormat) : undefined, endMonth)}
                onEndDateChange={(date) => updateMonthRange(startMonth, date ? date.format(dateFormat) : undefined)}
              />
              {isEntriesError ? (
                <MessageAlert message={isEntriesError.info.message} />
              ) : (
                <Stack>
                  <Box sx={{ pb: 2 }}>
                    {resultCountLabel && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        aria-live='polite'
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {resultCountLabel}
                      </Typography>
                    )}
                  </Box>
                  <MetricsBreakdownTable data={tableData} isLoading={isEntriesLoading} />
                </Stack>
              )}
            </Stack>
          </MetricsHeader>
        )}
      </Stack>
    </Container>
  )
}
