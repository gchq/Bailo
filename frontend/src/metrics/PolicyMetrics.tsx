import { Container, Stack } from '@mui/material'
import { useGetEntryRoles } from 'actions/entry'
import {
  useGetNoReleasesPolicyMetrics,
  useGetRolePolicyMetrics,
  useGetUnapprovedReleasesPolicyMetrics,
  useLifecyclePolicyMetrics,
} from 'actions/metrics'
import { ReactElement, useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import MetricsHeader from 'src/metrics/components/MetricsHeader'
import PolicyLifecycleMetricsCharts from 'src/metrics/PolicyLifecycleMetricsCharts'
import PolicyNoReleasesMetricsCharts from 'src/metrics/PolicyNoReleasesMetricsCharts'
import PolicyRoleMetricsCharts from 'src/metrics/PolicyRoleMetricsCharts'
import PolicyUnapprovedReleasesCharts from 'src/metrics/PolicyUnapprovedReleasesCharts'
import {
  BaseLifecycleMetrics,
  BaseNoReleaseMetrics,
  BaseUnapprovedReleaseMetrics,
  PolicyRoleMetrics,
} from 'types/types'

export const SelectedMetricKind = {
  MISSING_ROLES: 'role',
  NO_RELEASES: 'noReleases',
  UNAPPROVED_RELEASES: 'unapprovedReleases',
  LIFECYCLE: 'lifecycle',
} as const
export type SelectedMetricKindKeys = (typeof SelectedMetricKind)[keyof typeof SelectedMetricKind]

export const WeekFilterOptions = {
  OVERDUE: 0,
  TWO_WEEKS: 2,
  TEN_WEEKS: 10,
} as const
export type WeekFilterOptionsKeys = (typeof WeekFilterOptions)[keyof typeof WeekFilterOptions]

export default function PolicyMetrics() {
  const [selectedOrganisation, setSelectedOrganisation] = useState('All')
  const [dueDateWeekFilter, setDueDateWeekFilter] = useState<WeekFilterOptionsKeys>(2)

  const { rolePolicyMetrics, isRolePolicyMetricsLoading, isRolePolicyMetricsError } = useGetRolePolicyMetrics()
  const { noReleasesPolicyMetrics, isNoReleasesPolicyMetricsLoading, isNoReleasesPolicyMetricsError } =
    useGetNoReleasesPolicyMetrics()
  const {
    unapprovedReleasesPolicyMetrics,
    isUnapprovedReleasesPolicyMetricsLoading,
    isUnapprovedReleasesPolicyMetricsError,
  } = useGetUnapprovedReleasesPolicyMetrics()
  const { lifecyclePolicyMetrics, isLifecyclePolicyMetricsLoading, isLifecyclePolicyMetricsError } =
    useLifecyclePolicyMetrics(dueDateWeekFilter)
  const { entryRoles, isEntryRolesLoading, isEntryRolesError } = useGetEntryRoles()

  const filteredDataset = useCallback(
    (metricData) => {
      if (selectedOrganisation === 'All') {
        return metricData.global
      }
      return metricData.byOrganisation.find((subset) => subset.organisation === selectedOrganisation)
    },
    [selectedOrganisation],
  )
  const [selectedMetric, setSelectedMetric] = useState<SelectedMetricKindKeys>(SelectedMetricKind.MISSING_ROLES)
  const selectedData:
    undefined | PolicyRoleMetrics | BaseNoReleaseMetrics | BaseLifecycleMetrics | BaseUnapprovedReleaseMetrics =
    (() => {
      switch (selectedMetric) {
        case SelectedMetricKind.MISSING_ROLES:
          return rolePolicyMetrics
        case SelectedMetricKind.NO_RELEASES:
          return noReleasesPolicyMetrics
        case SelectedMetricKind.UNAPPROVED_RELEASES:
          return unapprovedReleasesPolicyMetrics
        case SelectedMetricKind.LIFECYCLE:
          return lifecyclePolicyMetrics
        default:
          return rolePolicyMetrics
      }
    })()
  const selectedChart: ReactElement = useMemo(() => {
    if (!selectedData) {
      return <></>
    }
    switch (selectedMetric) {
      case SelectedMetricKind.MISSING_ROLES:
        return <PolicyRoleMetricsCharts data={filteredDataset(rolePolicyMetrics)} entryRoles={entryRoles} />
      case SelectedMetricKind.NO_RELEASES:
        return <PolicyNoReleasesMetricsCharts data={filteredDataset(noReleasesPolicyMetrics)} entryRoles={entryRoles} />
      case SelectedMetricKind.UNAPPROVED_RELEASES:
        return (
          <PolicyUnapprovedReleasesCharts
            data={filteredDataset(unapprovedReleasesPolicyMetrics)}
            entryRoles={entryRoles}
          />
        )
      case SelectedMetricKind.LIFECYCLE:
        return (
          <PolicyLifecycleMetricsCharts
            data={filteredDataset(lifecyclePolicyMetrics)}
            weekFilter={dueDateWeekFilter}
            weekFilterOnChange={(newFilter) => setDueDateWeekFilter(newFilter)}
            entryRoles={entryRoles}
          />
        )
      default:
        return <></>
    }
  }, [
    dueDateWeekFilter,
    entryRoles,
    filteredDataset,
    lifecyclePolicyMetrics,
    noReleasesPolicyMetrics,
    rolePolicyMetrics,
    selectedData,
    selectedMetric,
    unapprovedReleasesPolicyMetrics,
  ])

  if (isRolePolicyMetricsError) {
    return <MessageAlert message={isRolePolicyMetricsError.info.message} />
  }

  if (isNoReleasesPolicyMetricsError) {
    return <MessageAlert message={isNoReleasesPolicyMetricsError.info.message} />
  }

  if (isUnapprovedReleasesPolicyMetricsError) {
    return <MessageAlert message={isUnapprovedReleasesPolicyMetricsError.info.message} />
  }

  if (isLifecyclePolicyMetricsError) {
    return <MessageAlert message={isLifecyclePolicyMetricsError.info.message} />
  }
  if (isEntryRolesError) {
    return <MessageAlert message={isEntryRolesError.info.message} />
  }

  if (
    isRolePolicyMetricsLoading ||
    isNoReleasesPolicyMetricsLoading ||
    isUnapprovedReleasesPolicyMetricsLoading ||
    isLifecyclePolicyMetricsLoading ||
    isEntryRolesLoading
  ) {
    return <Loading />
  }

  return (
    <Container maxWidth='lg'>
      <Stack spacing={4} sx={{ mt: 2 }}>
        {selectedData && selectedChart && (
          <MetricsHeader
            organisations={selectedData.byOrganisation.map((organisationSubset) => organisationSubset.organisation)}
            lastUpdated={selectedData.lastUpdated}
            onOrganisationChange={(newOrganisation) => setSelectedOrganisation(newOrganisation)}
            selectedOrganisation={selectedOrganisation}
            onMetricChange={(newMetric) => setSelectedMetric(newMetric)}
            selectedMetric={selectedMetric}
            exportDocumentTitle='Bailo policy metrics'
          >
            {selectedChart}
          </MetricsHeader>
        )}
      </Stack>
    </Container>
  )
}
