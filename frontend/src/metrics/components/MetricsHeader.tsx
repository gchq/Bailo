import { Box, Button, Container, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material'
import { ReactElement, useCallback, useMemo, useState } from 'react'
import MetricsExportPreview from 'src/metrics/MetricsExportPreview'
import { OverviewMetrics, PolicyMetrics } from 'types/types'
import { formatDateStringWithMinutes } from 'utils/dateUtils'

interface MetricsHeaderProps {
  data: OverviewMetrics | PolicyMetrics
  children: ReactElement
  selectedOrganisation: string
  onOrganisationChange: (newOrganisation: string) => void
  exportDocumentTitle: string
}

export default function MetricsHeader({
  data,
  children,
  selectedOrganisation,
  onOrganisationChange,
  exportDocumentTitle,
}: MetricsHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const listItems = useMemo(() => {
    if (!data) {
      return []
    }
    return new Set(
      data.byOrganisation
        .map((organisationSubset) => organisationSubset.organisation)
        .map((organisation) => (
          <MenuItem key={organisation} value={organisation}>
            {organisation === 'unset' ? <em>No organisation</em> : organisation}
          </MenuItem>
        )),
    )
  }, [data])

  const handleOrganisationSelectOnChange = useCallback(
    (event: SelectChangeEvent) => {
      onOrganisationChange(event.target.value as string)
    },
    [onOrganisationChange],
  )

  return (
    <Container maxWidth='lg'>
      <Stack spacing={4} sx={{ mt: 2 }}>
        <Stack direction={{ sm: 'column', md: 'row' }} sx={{ justifyContent: 'space-between' }}>
          <Stack spacing={1}>
            <Box>
              <Stack direction={{ sm: 'column', md: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
                <em>Showing results for</em>
                <Select
                  sx={{ maxWidth: '300px' }}
                  value={selectedOrganisation}
                  onChange={handleOrganisationSelectOnChange}
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
            <Button variant='contained' onClick={() => setDialogOpen(true)}>
              Export as PDF
            </Button>
          </Stack>
        </Stack>
        {children}
      </Stack>
      <MetricsExportPreview
        open={dialogOpen}
        setOpen={setDialogOpen}
        content={children}
        exportDocumentTitle={exportDocumentTitle}
      />
    </Container>
  )
}
