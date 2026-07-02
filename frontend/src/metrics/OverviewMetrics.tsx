import { Container, Divider, Stack } from '@mui/material'
import { useGetOverviewMetrics } from 'actions/metrics'
import { useGetSchemas } from 'actions/schema'
import { useCallback, useMemo, useRef, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import MetricsBreakdownPanel from 'src/metrics/MetricsBreakdownPanel'
import MetricsHeader from 'src/metrics/MetricsHeader'
import { BreakdownQueryType, BreakdownSelection } from 'src/metrics/metricsUtils'
import OverviewMetricsCharts from 'src/metrics/OverviewMetricsCharts'

export default function OverviewMetrics() {
  const { overviewMetrics, isOverviewMetricsLoading, isOverviewMetricsError } = useGetOverviewMetrics()
  const { schemas } = useGetSchemas()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')
  const [selection, setSelection] = useState<BreakdownSelection>(null)

  const filteredDataset = useMemo(() => {
    if (!overviewMetrics) {
      return undefined
    }
    if (selectedOrganisation === 'All') {
      return overviewMetrics.global
    }
    return overviewMetrics.byOrganisation.find((subset) => subset.organisation === selectedOrganisation)
  }, [overviewMetrics, selectedOrganisation])

  const breakdownPanelRef = useRef<HTMLDivElement>(null)

  const scrollToBreakdown = useCallback(() => {
    setTimeout(() => {
      breakdownPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }, [])

  const handleBreakdownSelection = useCallback(
    (type: BreakdownQueryType, value: string) => {
      setSelection((prev) => {
        if (prev && prev.type === type && prev.value === value) {
          return null
        }
        return { type, value }
      })
      scrollToBreakdown()
    },
    [scrollToBreakdown],
  )

  const handleOrganisationChange = useCallback((newOrganisation: string) => {
    setSelectedOrganisation(newOrganisation)
    setSelection(null)
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
            data={overviewMetrics}
            onOrganisationChange={handleOrganisationChange}
            selectedOrganisation={selectedOrganisation}
            exportDocumentTitle='Bailo overview metrics'
          >
            <Stack spacing={4}>
              <OverviewMetricsCharts
                data={filteredDataset}
                organisationList={overviewMetrics.byOrganisation.map(
                  (organisationSubset) => organisationSubset.organisation,
                )}
                selectedOrganisation={selectedOrganisation}
                selection={selection}
                onSelect={handleBreakdownSelection}
              />
              {selection && (
                <>
                  <Divider />
                  <MetricsBreakdownPanel
                    schemas={schemas}
                    queryType={selection.type}
                    queryValue={selection.value}
                    organisation={selectedOrganisation}
                    onClose={() => setSelection(null)}
                    panelRef={breakdownPanelRef}
                  />
                </>
              )}
            </Stack>
          </MetricsHeader>
        )}
      </Stack>
    </Container>
  )
}
