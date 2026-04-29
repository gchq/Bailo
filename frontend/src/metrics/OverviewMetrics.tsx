import { Container, Stack } from '@mui/material'
import { useGetGetOverviewMetrics } from 'actions/metrics'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent, useState } from 'react'
import Loading from 'src/common/Loading'
import { SettingsCategory } from 'src/entry/settings/Settings'
import MessageAlert from 'src/MessageAlert'
import OverviewMetricsCharts from 'src/metrics/OverviewMetricsCharts'
import { OverviewBaseMetrics } from 'types/types'

export default function OverviewMetrics() {
  const router = useRouter()

  const { organisationFromRouter } = router.query

  const { overviewMetrics, isOverviewMetricsLoading, isOverviewMetricsError } = useGetGetOverviewMetrics()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')
  const [filteredDataset, setFilteredDataset] = useState<OverviewBaseMetrics | undefined>(undefined)

  const setSelectedOrganisationEffectEvent = useEffectEvent((newOrganisation: string) => {
    setSelectedOrganisation(newOrganisation)
  })

  useEffect(() => {
    if (organisationFromRouter) {
      setSelectedOrganisationEffectEvent(organisationFromRouter as string)
      router.replace({
        query: { ...router.query, category: SettingsCategory.DETAILS },
      })
    }
  }, [organisationFromRouter, router])

  const setFilteredDatasetEffectEvent = useEffectEvent((data: any) => {
    setFilteredDataset(data)
  })

  useEffect(() => {
    if (!overviewMetrics) {
      return
    }
    if (selectedOrganisation === 'All') {
      setFilteredDatasetEffectEvent(overviewMetrics.global)
    } else {
      const dataSubset = overviewMetrics.byOrganisation.find(
        (subset: any) => subset.organisation === selectedOrganisation,
      )
      if (dataSubset) {
        setFilteredDatasetEffectEvent(dataSubset)
      } else {
        setFilteredDatasetEffectEvent(undefined)
      }
    }
  }, [overviewMetrics, selectedOrganisation])

  if (isOverviewMetricsError) {
    return <MessageAlert message={isOverviewMetricsError.info.message} />
  }

  if (isOverviewMetricsLoading) {
    return <Loading />
  }

  return (
    <Container maxWidth='xl'>
      <Stack spacing={4} sx={{ mt: 2 }}>
        {filteredDataset && overviewMetrics && (
          <OverviewMetricsCharts
            data={filteredDataset}
            organisationList={overviewMetrics.byOrganisation.map(
              (organisationSubset) => organisationSubset.organisation,
            )}
            selectedOrganisation={selectedOrganisation}
            onSelectedOrganisationChange={(newOrganisation) => setSelectedOrganisation(newOrganisation)}
          />
        )}
      </Stack>
    </Container>
  )
}
