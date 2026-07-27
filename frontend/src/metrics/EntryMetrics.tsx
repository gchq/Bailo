import dayjs from '@dayjs'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { useGetModelBreakdown, useGetOverviewMetrics } from 'actions/metrics'
import { useGetSchemas } from 'actions/schema'
import { useCallback, useMemo } from 'react'
import { FilterMenuButton } from 'src/common/FilterMenuButton'
import Loading from 'src/common/Loading'
import { useEntriesFilters } from 'src/hooks/useEntriesFilters'
import MessageAlert from 'src/MessageAlert'
import { MetricsBreakdownTable } from 'src/metrics/components/MetricsBreakdownTable'
import MetricsHeader from 'src/metrics/components/MetricsHeader'
import { MonthlyUploadsSelector } from 'src/metrics/components/MonthlyUploadsSelector'
import { SystemRole } from 'types/types'
import { downloadCsv, toSemiColonSeparatedString } from 'utils/csvUtils'
import { currentTimestampSimple } from 'utils/dateUtils'
import { dateFormat, filterIncludeTypes, filterSelectTypes } from 'utils/metricsUtils'
import { toKebabCase } from 'utils/stringUtils'

const exportDocumentTitle = 'Bailo entry metrics'
const headers = ['Entry ID', 'Name', 'Kind', 'Owner']

export default function EntryMetrics() {
  const { overviewMetrics, isOverviewMetricsLoading, isOverviewMetricsError } = useGetOverviewMetrics()
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()

  // Filters are sourced directly from the URL so this view can be deep linked.
  const { filters, setFilters } = useEntriesFilters()
  const { entries, isEntriesLoading, isEntriesError } = useGetModelBreakdown(filters)

  const selectedValue = useCallback((key: keyof typeof filters) => filters[key] ?? filterSelectTypes.ALL, [filters])

  const stateOptions = useMemo(
    () => [filterSelectTypes.ALL, ...(overviewMetrics?.global.entryState?.map((s) => s.state) ?? [])],
    [overviewMetrics],
  )

  const schemaOptions = useMemo(
    () => [
      { value: filterSelectTypes.ALL, label: filterSelectTypes.ALL },
      { value: filterSelectTypes.NONE, label: 'None' },
      ...(schemas ?? []).map((schema) => ({ value: schema.id, label: schema.name })),
    ],
    [schemas],
  )

  const releaseOptions = [
    { value: filterSelectTypes.ALL, label: filterSelectTypes.ALL },
    { value: filterIncludeTypes.WITH, label: 'With releases' },
    { value: filterIncludeTypes.WITHOUT, label: 'Without releases' },
  ]

  const accessRequestOptions = [
    { value: filterSelectTypes.ALL, label: filterSelectTypes.ALL },
    { value: filterIncludeTypes.WITH, label: 'With access request' },
    { value: filterIncludeTypes.WITHOUT, label: 'Without access request' },
  ]

  const tableData = useMemo(
    () =>
      (entries ?? []).map((entry) => ({
        entryId: entry.entryId,
        entryName: entry.entryName,
        entryKind: entry.entryKind,
        modelOwners:
          entry.collaborators
            ?.filter((person) => person.roles.includes(SystemRole.Owner))
            .map((person) => person.entity) ?? [],
      })),
    [entries],
  )

  const handleCsvExport = useCallback(async () => {
    const rows = tableData.map((row) => [
      row.entryId,
      row.entryName,
      row.entryKind,
      toSemiColonSeparatedString(row.modelOwners),
    ])
    const csvFileName = `${toKebabCase(exportDocumentTitle)}-${currentTimestampSimple()}`

    await downloadCsv(csvFileName, headers, rows)
  }, [tableData])

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
    setFilters({
      state: undefined,
      schemaId: undefined,
      release: undefined,
      accessRequest: undefined,
      startMonth: undefined,
      endMonth: undefined,
    })
  }, [setFilters])

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
    !filters.state &&
    !filters.schemaId &&
    !filters.release &&
    !filters.accessRequest &&
    !filters.startMonth &&
    !filters.endMonth

  return (
    <Container maxWidth='lg' sx={{ mb: 4 }}>
      <Stack spacing={0.5} sx={{ mt: 2, mb: 4 }}>
        {overviewMetrics && (
          <MetricsHeader
            organisations={overviewMetrics.byOrganisation.map((organisationSubset) => organisationSubset.organisation)}
            lastUpdated={overviewMetrics.lastUpdated}
            onOrganisationChange={(value) =>
              setFilters({ organisation: value === filterSelectTypes.ALL ? undefined : value })
            }
            selectedOrganisation={selectedValue('organisation')}
            exportDocumentTitle={exportDocumentTitle}
            titleObjectType='entries'
            showCsvExport
            onCsvExport={tableData.length > 0 ? handleCsvExport : undefined}
          >
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
                <Stack direction='row' spacing={1}>
                  <FilterMenuButton
                    label='State'
                    options={stateOptions.map((s) => ({ value: s, label: s }))}
                    selectedValue={selectedValue('state')}
                    onSelect={(value) => setFilters({ state: value === filterSelectTypes.ALL ? undefined : value })}
                  />
                  <FilterMenuButton
                    label='Schema'
                    options={schemaOptions}
                    selectedValue={selectedValue('schemaId')}
                    onSelect={(value) => setFilters({ schemaId: value === filterSelectTypes.ALL ? undefined : value })}
                  />
                  <FilterMenuButton
                    label='Release'
                    options={releaseOptions}
                    selectedValue={selectedValue('release')}
                    onSelect={(value) => setFilters({ release: value === filterSelectTypes.ALL ? undefined : value })}
                  />
                  <FilterMenuButton
                    label='Access request'
                    options={accessRequestOptions}
                    selectedValue={selectedValue('accessRequest')}
                    onSelect={(value) =>
                      setFilters({ accessRequest: value === filterSelectTypes.ALL ? undefined : value })
                    }
                  />
                  <Button disabled={isClearDisabled} onClick={handleClearFiltersOnClick}>
                    Clear filters
                  </Button>
                </Stack>
              </Stack>
              <MonthlyUploadsSelector
                startDate={filters.startMonth ? dayjs(filters.startMonth) : null}
                endDate={filters.endMonth ? dayjs(filters.endMonth) : null}
                showTitle={false}
                onStartDateChange={(date) => setFilters({ startMonth: date ? date.format(dateFormat) : undefined })}
                onEndDateChange={(date) => setFilters({ endMonth: date ? date.format(dateFormat) : undefined })}
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
                  <MetricsBreakdownTable headers={headers} data={tableData} isLoading={isEntriesLoading} />
                </Stack>
              )}
            </Stack>
          </MetricsHeader>
        )}
      </Stack>
    </Container>
  )
}
