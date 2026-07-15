import { Container, Stack } from '@mui/material'
import { useGetPolicyMetrics } from 'actions/metrics'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import MetricsHeader from 'src/metrics/components/MetricsHeader'
import PolicyMetricsCharts from 'src/metrics/PolicyMetricsCharts'

export default function PolicyMetrics() {
  const { policyMetrics, isPolicyMetricsLoading, isPolicyMetricsError } = useGetPolicyMetrics()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')

  const filteredDataset = useMemo(() => {
    if (!policyMetrics) {
      return undefined
    }
    if (selectedOrganisation === 'All') {
      return policyMetrics.global
    }
    return policyMetrics.byOrganisation.find((subset) => subset.organisation === selectedOrganisation)
  }, [policyMetrics, selectedOrganisation])

  if (isPolicyMetricsError) {
    return <MessageAlert message={isPolicyMetricsError.info.message} />
  }

  if (isPolicyMetricsLoading) {
    return <Loading />
  }

  return (
    <Container maxWidth='lg'>
      <Stack spacing={4} sx={{ mt: 2 }}>
        {filteredDataset && policyMetrics && (
          <MetricsHeader
            data={policyMetrics}
            onOrganisationChange={(newOrganisation) => setSelectedOrganisation(newOrganisation)}
            selectedOrganisation={selectedOrganisation}
            exportDocumentTitle='Bailo policy metrics'
          >
            <PolicyMetricsCharts data={filteredDataset} />
          </MetricsHeader>
        )}
      </Stack>
    </Container>
  )
}
