import { Container, Stack } from '@mui/material'
import { useGetRolePolicyMetrics } from 'actions/metrics'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import MetricsHeader from 'src/metrics/MetricsHeader'
import PolicyMetricsCharts from 'src/metrics/PolicyMetricsCharts'

export default function PolicyMetrics() {
  const { rolePolicyMetrics, isRolePolicyMetricsLoading, isRolePolicyMetricsError } = useGetRolePolicyMetrics()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')

  const filteredDataset = useMemo(() => {
    if (!rolePolicyMetrics) {
      return undefined
    }
    if (selectedOrganisation === 'All') {
      return rolePolicyMetrics.global
    }
    return rolePolicyMetrics.byOrganisation.find((subset) => subset.organisation === selectedOrganisation)
  }, [rolePolicyMetrics, selectedOrganisation])

  if (isRolePolicyMetricsError) {
    return <MessageAlert message={isRolePolicyMetricsError.info.message} />
  }

  if (isRolePolicyMetricsLoading) {
    return <Loading />
  }

  return (
    <Container maxWidth='lg'>
      <Stack spacing={4} sx={{ mt: 2 }}>
        {filteredDataset && rolePolicyMetrics && (
          <MetricsHeader
            data={rolePolicyMetrics}
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
