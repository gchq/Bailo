import { Container, Stack } from '@mui/material'
import { useGetOverviewMetrics } from 'actions/metrics'
import { useGetSchemas } from 'actions/schema'
import { useRouter } from 'next/router'
import { useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import MetricsHeader from 'src/metrics/MetricsHeader'
import OverviewMetricsCharts from 'src/metrics/OverviewMetricsCharts'
import { BreakdownQueryType, buildEntriesTabHref } from 'utils/metricsUtils'

export default function OverviewMetrics() {
  const router = useRouter()
  const { overviewMetrics, isOverviewMetricsLoading, isOverviewMetricsError } = useGetOverviewMetrics()
  const { schemas } = useGetSchemas()

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

  const handleBreakdownSelection = useCallback(
    (type: BreakdownQueryType, value: string) => {
      const href = buildEntriesTabHref(type, value, { organisation: selectedOrganisation, schemas: schemas ?? [] })
      router.push(href)
    },
    [router, selectedOrganisation, schemas],
  )

  const handleOrganisationChange = useCallback((newOrganisation: string) => {
    setSelectedOrganisation(newOrganisation)
  }, [])

  if (isOverviewMetricsError) {
    return <MessageAlert message={isOverviewMetricsError.info.message} />
  }

  if (isOverviewMetricsLoading) {
    return <Loading />
  }

  return (
    <Container maxWidth='lg'>
      <Stack spacing={4} sx={{ mt: 2, mb: 4 }}>
        {filteredDataset && overviewMetrics && (
          <MetricsHeader
            organisations={overviewMetrics.byOrganisation.map((organisationSubset) => organisationSubset.organisation)}
            lastUpdated={overviewMetrics.lastUpdated}
            onOrganisationChange={handleOrganisationChange}
            selectedOrganisation={selectedOrganisation}
            exportDocumentTitle='Bailo overview metrics'
          >
            <OverviewMetricsCharts
              data={filteredDataset}
              organisationList={overviewMetrics.byOrganisation.map(
                (organisationSubset) => organisationSubset.organisation,
              )}
              selectedOrganisation={selectedOrganisation}
              onSelect={handleBreakdownSelection}
            />
          </MetricsHeader>
        )}
      </Stack>
    </Container>
  )
}
