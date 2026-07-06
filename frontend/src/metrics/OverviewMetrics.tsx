import { Container, Stack } from '@mui/material'
import { useGetOverviewMetrics } from 'actions/metrics'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import MetricsHeader from 'src/metrics/MetricsHeader'
import OverviewMetricsCharts from 'src/metrics/OverviewMetricsCharts'

export default function OverviewMetrics() {
  const { overviewMetrics, isOverviewMetricsLoading, isOverviewMetricsError } = useGetOverviewMetrics()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')

  const filteredDataset = useMemo(() => {
    if (!overviewMetrics) {
      return undefined
    }
    if (selectedOrganisation === 'All') {
      return overviewMetrics.global
    }
    return overviewMetrics.byOrganisation.find((subset) => subset.organisation === selectedOrganisation)
  }, [overviewMetrics, selectedOrganisation])

  if (isOverviewMetricsError) {
    return <MessageAlert message={isOverviewMetricsError.info.message} />
  }

  if (isOverviewMetricsLoading) {
    return <Loading />
  }

  return (
    <Container maxWidth='lg'>
      <Stack spacing={4} sx={{ mt: 2 }}>
        {filteredDataset && overviewMetrics && (
          <MetricsHeader
            organisations={overviewMetrics.byOrganisation.map((organisationSubset) => organisationSubset.organisation)}
            lastUpdated={overviewMetrics.lastUpdated}
            onOrganisationChange={(newOrganisation) => setSelectedOrganisation(newOrganisation)}
            selectedOrganisation={selectedOrganisation}
            exportDocumentTitle='Bailo overview metrics'
          >
            <OverviewMetricsCharts
              data={filteredDataset}
              organisationList={overviewMetrics.byOrganisation.map(
                (organisationSubset) => organisationSubset.organisation,
              )}
              selectedOrganisation={selectedOrganisation}
            />
          </MetricsHeader>
        )}
      </Stack>
    </Container>
  )
}
