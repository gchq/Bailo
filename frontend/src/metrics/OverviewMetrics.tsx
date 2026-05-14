import { Box, Button, Container, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import { useGetOverviewMetrics } from 'actions/metrics'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import Loading from 'src/common/Loading'
import { SettingsCategory } from 'src/entry/settings/Settings'
import MessageAlert from 'src/MessageAlert'
import OverviewMetricsCharts from 'src/metrics/OverviewMetricsCharts'
import { OrganisationOverviewMetrics, OverviewBaseMetrics } from 'types/types'
import { formatDateStringWithMinutes } from 'utils/dateUtils'

export default function OverviewMetrics() {
  const router = useRouter()

  const { organisationFromRouter } = router.query

  const { overviewMetrics, isOverviewMetricsLoading, isOverviewMetricsError } = useGetOverviewMetrics()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')
  const [filteredDataset, setFilteredDataset] = useState<OverviewBaseMetrics | undefined>(undefined)

  const contentRef = useRef<HTMLDivElement>(null)

  const exportModelCard = useReactToPrint({
    contentRef: contentRef,
    documentTitle: 'Bailo policy metrics',
  })

  const handleExportOnClick = () => {
    if (contentRef) {
      exportModelCard()
    }
  }

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

  const setFilteredDatasetEffectEvent = useEffectEvent((data: OverviewBaseMetrics | undefined) => {
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
        (subset: OrganisationOverviewMetrics) => subset.organisation === selectedOrganisation,
      )
      if (dataSubset) {
        setFilteredDatasetEffectEvent(dataSubset)
      } else {
        setFilteredDatasetEffectEvent(undefined)
      }
    }
  }, [overviewMetrics, selectedOrganisation])

  const listItems = useMemo(() => {
    if (!overviewMetrics) {
      return []
    }
    return overviewMetrics.byOrganisation
      .map((organisationSubset) => organisationSubset.organisation)
      .map((organisation) => (
        <MenuItem key={organisation} value={organisation}>
          {organisation === 'unset' ? <em>No organisation</em> : organisation}
        </MenuItem>
      ))
  }, [overviewMetrics])

  const handleOrganisationSelectOnChange = useCallback(
    (event: SelectChangeEvent) => {
      setSelectedOrganisation(event.target.value)
    },
    [setSelectedOrganisation],
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
        <Stack direction={{ sm: 'column', md: 'row' }} justifyContent='space-between'>
          <Stack spacing={1}>
            <Box>
              <Stack direction={{ sm: 'column', md: 'row' }} spacing={1} alignItems='center'>
                <Typography fontStyle='italic'>Showing results for</Typography>
                <Select
                  sx={{ maxWidth: '300px' }}
                  value={selectedOrganisation}
                  onChange={(e) => handleOrganisationSelectOnChange(e)}
                  variant='standard'
                >
                  <MenuItem key='all' value='All'>
                    All organisations
                  </MenuItem>
                  {listItems}
                </Select>
              </Stack>
            </Box>
            {overviewMetrics && (
              <Typography variant='caption'>
                <em>Last updated {formatDateStringWithMinutes(overviewMetrics.lastUpdated)}</em>
              </Typography>
            )}
          </Stack>
          <Stack>
            <Button variant='contained' onClick={handleExportOnClick}>
              Export as PDF
            </Button>
          </Stack>
        </Stack>
        {filteredDataset && overviewMetrics && (
          <Box ref={contentRef}>
            <OverviewMetricsCharts
              data={filteredDataset}
              organisationList={overviewMetrics.byOrganisation.map(
                (organisationSubset) => organisationSubset.organisation,
              )}
              selectedOrganisation={selectedOrganisation}
            />
          </Box>
        )}
      </Stack>
    </Container>
  )
}
