import { Container, Stack } from '@mui/material'
import { useGetNoReleasesPolicyMetrics, useGetRolePolicyMetrics } from 'actions/metrics'
import { ReactElement, useCallback, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import MetricsHeader from 'src/metrics/MetricsHeader'
import PolicyNoReleasesMetricsCharts from 'src/metrics/PolicyNoReleasesMetricsCharts'
import PolicyRoleMetricsCharts from 'src/metrics/PolicyRoleMetricsCharts'
import { BaseNoReleaseMetrics, PolicyRoleMetrics } from 'types/types'

export const SelectedMetricKind = {
  MISSING_ROLES: 'role',
  NO_RELEASES: 'noReleases',
} as const
export type SelectedMetricKindKeys = (typeof SelectedMetricKind)[keyof typeof SelectedMetricKind]

export default function PolicyMetrics() {
  const { rolePolicyMetrics, isRolePolicyMetricsLoading, isRolePolicyMetricsError } = useGetRolePolicyMetrics()
  const { noReleasesPolicyMetrics, isNoReleasesPolicyMetricsLoading, isNoReleasesPolicyMetricsError } =
    useGetNoReleasesPolicyMetrics()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')

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
  const selectedData: undefined | PolicyRoleMetrics | BaseNoReleaseMetrics = (() => {
    switch (selectedMetric) {
      case SelectedMetricKind.MISSING_ROLES:
        return rolePolicyMetrics
      case SelectedMetricKind.NO_RELEASES:
        return noReleasesPolicyMetrics
      default:
        return rolePolicyMetrics
    }
  })()
  const selectedChart: ReactElement = useMemo(() => {
    if (!selectedData) {
      return <></>
    }
    const filtered = filteredDataset(selectedData)
    if (!filtered || filtered.entries.length === 0) {
      return <EmptyBlob text='No items to display.' />
    }
    switch (selectedMetric) {
      case SelectedMetricKind.MISSING_ROLES:
        return <PolicyRoleMetricsCharts data={filteredDataset(rolePolicyMetrics)} />
      case SelectedMetricKind.NO_RELEASES:
        return <PolicyNoReleasesMetricsCharts data={filteredDataset(noReleasesPolicyMetrics)} />
      default:
        return <></>
    }
  }, [filteredDataset, noReleasesPolicyMetrics, rolePolicyMetrics, selectedData, selectedMetric])

  if (isRolePolicyMetricsError) {
    return <MessageAlert message={isRolePolicyMetricsError.info.message} />
  }

  if (isNoReleasesPolicyMetricsError) {
    return <MessageAlert message={isNoReleasesPolicyMetricsError.info.message} />
  }

  if (isRolePolicyMetricsLoading || isNoReleasesPolicyMetricsLoading) {
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
