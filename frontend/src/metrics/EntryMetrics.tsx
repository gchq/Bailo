import { Box, Container, Stack, Typography } from '@mui/material'
import { useGetModelBreakdown, useGetOverviewMetrics } from 'actions/metrics'
import { useGetSchemas } from 'actions/schema'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { FilterMenuButton } from 'src/common/FilterMenuButton'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import MetricsBreakdownTable from 'src/metrics/components/MetricsBreakdownTable'
import { SystemRole } from 'types/types'
import { buildEntriesHref, EntriesFilterQuery } from 'utils/metricsUtils'

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

  const { entries, isEntriesLoading, isEntriesError } = useGetModelBreakdown({
    organisation: organisation !== ALL_VALUE ? organisation : undefined,
    state: state !== ALL_VALUE ? state : undefined,
    schemaId: schemaId !== ALL_VALUE ? schemaId : undefined,
    release: release !== ALL_VALUE ? release : undefined,
    accessRequest: accessRequest !== ALL_VALUE ? accessRequest : undefined,
  })

  function updateFilter(key: keyof EntriesFilterQuery, value: string) {
    const current: EntriesFilterQuery = {
      organisation: organisation !== ALL_VALUE ? organisation : undefined,
      state: state !== ALL_VALUE ? state : undefined,
      schemaId: schemaId !== ALL_VALUE ? schemaId : undefined,
      release: release !== ALL_VALUE ? release : undefined,
      accessRequest: accessRequest !== ALL_VALUE ? accessRequest : undefined,
    }

    const next = {
      ...current,
      [key]: value === ALL_VALUE ? undefined : value,
    }

    router.push(buildEntriesHref(next), undefined, { shallow: true })
  }

  const organisationOptions = useMemo(
    () => [ALL_VALUE, ...(overviewMetrics?.byOrganisation.map((org) => org.organisation) ?? [])],
    [overviewMetrics],
  )

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
    { value: 'with', label: 'With releases' },
    { value: 'without', label: 'Without releases' },
  ]

  const accessRequestOptions = [
    { value: ALL_VALUE, label: ALL_VALUE },
    { value: 'with', label: 'With access request' },
    { value: 'without', label: 'Without access request' },
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

  if (isOverviewMetricsError) {
    return <MessageAlert message={isOverviewMetricsError.info.message} />
  }
  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} />
  }
  if (isOverviewMetricsLoading || isSchemasLoading) {
    return <Loading />
  }

  return (
    <Container maxWidth='lg' sx={{ mb: 2 }}>
      <Stack spacing={2} sx={{ mt: 2, mb: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant='h6' color='primary' sx={{ fontWeight: 'bold' }}>
            Entries
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Browse and filter individual entries by organisation, lifecycle state, schema and more.
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
          <Stack direction='row' spacing={1}>
            <FilterMenuButton
              label='Organisation'
              options={organisationOptions.map((org) => ({ value: org, label: org }))}
              selectedValue={organisation}
              onSelect={(value) => updateFilter('organisation', value)}
            />
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
              // this onSelect needs updating, not sure how best to do this
              onSelect={(value) => updateFilter('release', value)}
            />
            <FilterMenuButton
              label='Access request'
              options={accessRequestOptions}
              selectedValue={accessRequest}
              // this onSelect needs updating, not sure how best to do this
              onSelect={(value) => updateFilter('accessRequest', value)}
            />
          </Stack>
        </Stack>
      </Stack>
      {isEntriesError ? (
        <MessageAlert message={isEntriesError.info.message} />
      ) : (
        <Stack>
          <Box sx={{ pb: 2 }}>
            {resultCountLabel && (
              <Typography variant='body2' color='text.secondary' aria-live='polite' sx={{ whiteSpace: 'nowrap' }}>
                {resultCountLabel}
              </Typography>
            )}
          </Box>
          <MetricsBreakdownTable data={tableData} isLoading={isEntriesLoading} />
        </Stack>
      )}
    </Container>
  )
}
