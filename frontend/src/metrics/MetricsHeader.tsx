import { Box, Button, Container, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import { ReactElement, useCallback, useMemo, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { OverviewMetrics, PolicyMetrics } from 'types/types'
import { formatDateStringWithMinutes } from 'utils/dateUtils'

interface MetricsHeaderProps {
  data: OverviewMetrics | PolicyMetrics
  children: ReactElement
  selectedOrganisation: string
  onOrganisationChange: (newOrganisation: string) => void
}

export default function MetricsHeader({
  data,
  children,
  selectedOrganisation,
  onOrganisationChange,
}: MetricsHeaderProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const exportMetricsOverview = useReactToPrint({
    contentRef: contentRef,
    documentTitle: 'Bailo overview metrics',
  })

  const handleExportOnClick = () => {
    if (contentRef) {
      exportMetricsOverview()
    }
  }

  const listItems = useMemo(() => {
    if (!data) {
      return []
    }
    return data.byOrganisation
      .map((organisationSubset) => organisationSubset.organisation)
      .map((organisation) => (
        <MenuItem key={organisation} value={organisation}>
          {organisation === 'unset' ? <em>No organisation</em> : organisation}
        </MenuItem>
      ))
  }, [data])

  const handleOrganisationSelectOnChange = useCallback(
    (event: SelectChangeEvent) => {
      onOrganisationChange(event.target.value)
    },
    [onOrganisationChange],
  )

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
            {data && (
              <Typography variant='caption'>
                <em>Last updated {formatDateStringWithMinutes(data.lastUpdated)}</em>
              </Typography>
            )}
          </Stack>
          <Stack>
            <Button variant='contained' onClick={handleExportOnClick}>
              Export as PDF
            </Button>
          </Stack>
        </Stack>
        {children}
      </Stack>
    </Container>
  )
}
