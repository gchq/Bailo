import { Container, Divider, Stack } from '@mui/material'
import { useGetOverviewMetrics } from 'actions/metrics'
import { useGetSchemas } from 'actions/schema'
import { useCallback, useMemo, useRef, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import MetricsBreakdownPanel from 'src/metrics/MetricsBreakdownPanel'
import MetricsHeader from 'src/metrics/MetricsHeader'
import OverviewMetricsCharts from 'src/metrics/OverviewMetricsCharts'

export default function OverviewMetrics() {
  const { overviewMetrics, isOverviewMetricsLoading, isOverviewMetricsError } = useGetOverviewMetrics()
  const { schemas } = useGetSchemas()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null)

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

  const handleStateClick = useCallback(
    (state: string | null) => {
      setSelectedSchema(null) // clear the other selection
      setSelectedState((prev) => (state === prev ? null : state))
      if (state) {
        scrollToBreakdown()
      }
    },
    [scrollToBreakdown],
  )

  const handleSchemaClick = useCallback(
    (schema: string | null) => {
      setSelectedState(null) // clear the other selection
      setSelectedSchema((prev) => (schema === prev ? null : schema))
      if (schema) {
        scrollToBreakdown()
      }
    },
    [scrollToBreakdown],
  )

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
            data={overviewMetrics}
            onOrganisationChange={(newOrganisation) => setSelectedOrganisation(newOrganisation)}
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
                selectedState={selectedState}
                selectedSchema={selectedSchema}
                onStateClick={handleStateClick}
                onSchemaClick={handleSchemaClick}
              />
              {(selectedState || selectedSchema) && (
                <>
                  <Divider />
                  <MetricsBreakdownPanel
                    schemas={schemas}
                    queryType={selectedState ? 'byState' : 'bySchema'}
                    queryValue={(selectedState ?? selectedSchema) as string}
                    organisation={selectedOrganisation}
                    onClose={() => handleStateClick(null)}
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
