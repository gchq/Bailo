import { Box, Button, Container, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import { useGetPolicyMetrics } from 'actions/metrics'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import Loading from 'src/common/Loading'
import { SettingsCategory } from 'src/entry/settings/Settings'
import MessageAlert from 'src/MessageAlert'
import PolicyMetricsCharts from 'src/metrics/PolicyMetricsCharts'
import { PolicyBaseMetrics } from 'types/types'
import { formatDateStringWithMinutes } from 'utils/dateUtils'

export default function PolicyMetrics() {
  const router = useRouter()

  const { organisationFromRouter } = router.query

  const { policyMetrics, isPolicyMetricsLoading, isPolicyMetricsError } = useGetPolicyMetrics()

  const [selectedOrganisation, setSelectedOrganisation] = useState('All')
  const [filteredDataset, setFilteredDataset] = useState<PolicyBaseMetrics | undefined>(undefined)

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

  const setFilteredDatasetEffectEvent = useEffectEvent((data: any) => {
    setFilteredDataset(data)
  })

  useEffect(() => {
    if (!policyMetrics) {
      return
    }
    if (selectedOrganisation === 'All') {
      setFilteredDatasetEffectEvent(policyMetrics.global)
    } else {
      const dataSubset = policyMetrics.byOrganisation.find(
        (subset: any) => subset.organisation === selectedOrganisation,
      )
      if (dataSubset) {
        setFilteredDatasetEffectEvent(dataSubset)
      } else {
        setFilteredDatasetEffectEvent(undefined)
      }
    }
  }, [policyMetrics, selectedOrganisation])

  const handleOrganisationSelectOnChange = useCallback((event: SelectChangeEvent) => {
    setSelectedOrganisation(event.target.value)
  }, [])

  const listItems = useMemo(() => {
    if (!policyMetrics) {
      return []
    }
    return policyMetrics.byOrganisation.map((organisationSubset) => (
      <MenuItem key={organisationSubset.organisation} value={organisationSubset.organisation}>
        {organisationSubset.organisation === 'unset' ? <em>No organisation</em> : organisationSubset.organisation}
      </MenuItem>
    ))
  }, [policyMetrics])

  if (isPolicyMetricsError) {
    return <MessageAlert message={isPolicyMetricsError.info.message} />
  }

  if (isPolicyMetricsLoading) {
    return <Loading />
  }

  return (
    <Container maxWidth='lg'>
      <Stack spacing={4} sx={{ mt: 2 }}>
        <Stack direction='row' justifyContent='space-between'>
          <Stack direction='row' alignItems='center' spacing={1}>
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
          <Stack>
            <Button variant='contained' onClick={handleExportOnClick}>
              Export as PDF
            </Button>
            {policyMetrics && <em>Last updated {formatDateStringWithMinutes(policyMetrics.lastUpdated)}</em>}
          </Stack>
        </Stack>
        {filteredDataset && (
          <Box ref={contentRef}>
            <PolicyMetricsCharts data={filteredDataset} />
          </Box>
        )}
      </Stack>
    </Container>
  )
}
