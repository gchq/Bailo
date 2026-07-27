import {
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material'
import { ReactElement, useCallback, useState } from 'react'
import MetricsExportPreview from 'src/metrics/MetricsExportPreview'
import { SelectedMetricKind, SelectedMetricKindKeys } from 'src/metrics/PolicyMetrics'
import { formatDateStringWithMinutes } from 'utils/dateUtils'
import { filterSelectTypes } from 'utils/metricsUtils'

interface MetricsHeaderProps {
  organisations: string[]
  lastUpdated: string
  children: ReactElement
  selectedOrganisation: string
  onOrganisationChange: (newOrganisation: string) => void
  selectedMetric?: SelectedMetricKindKeys
  onMetricChange?: (newMetric: SelectedMetricKindKeys) => void
  exportDocumentTitle: string
  titleObjectType?: string
  showCsvExport?: boolean
  onCsvExport?: () => Promise<void> | void
}

export default function MetricsHeader({
  organisations,
  lastUpdated,
  children,
  selectedOrganisation,
  onOrganisationChange,
  selectedMetric,
  onMetricChange,
  exportDocumentTitle,
  titleObjectType = 'metrics',
  showCsvExport = false,
  onCsvExport,
}: MetricsHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCsvExporting, setIsCsvExporting] = useState(false)

  const handleOrganisationSelectOnChange = useCallback(
    (event: SelectChangeEvent) => {
      onOrganisationChange(event.target.value as string)
    },
    [onOrganisationChange],
  )

  const handleMetricSelectOnChange = useCallback(
    (event: SelectChangeEvent) => {
      if (onMetricChange) {
        onMetricChange(event.target.value as SelectedMetricKindKeys)
      }
    },
    [onMetricChange],
  )

  const handleCsvExportOnClick = useCallback(async () => {
    if (!onCsvExport) {
      return
    }
    setIsCsvExporting(true)
    try {
      await onCsvExport()
    } finally {
      setIsCsvExporting(false)
    }
  }, [onCsvExport])

  return (
    <Container maxWidth='lg'>
      <Stack spacing={4} sx={{ mt: 2 }}>
        <Stack direction={{ sm: 'column', md: 'row' }} sx={{ justifyContent: 'space-between' }}>
          <Stack spacing={1}>
            <Box>
              <Stack direction={{ sm: 'column', md: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
                <em>Showing {titleObjectType} for</em>
                {selectedMetric && (
                  <>
                    <Select
                      sx={{ maxWidth: '300px' }}
                      value={selectedMetric}
                      onChange={handleMetricSelectOnChange}
                      variant='standard'
                    >
                      <MenuItem key={SelectedMetricKind.MISSING_ROLES} value={SelectedMetricKind.MISSING_ROLES}>
                        missing review roles
                      </MenuItem>
                      <MenuItem key={SelectedMetricKind.NO_RELEASES} value={SelectedMetricKind.NO_RELEASES}>
                        models with no releases
                      </MenuItem>
                    </Select>
                    <em>for</em>
                  </>
                )}
                <Select
                  sx={{ maxWidth: '300px' }}
                  value={selectedOrganisation}
                  onChange={handleOrganisationSelectOnChange}
                  variant='standard'
                >
                  <MenuItem key='all' value={filterSelectTypes.ALL}>
                    all organisations
                  </MenuItem>
                  {organisations.map((organisation) => (
                    <MenuItem key={organisation} value={organisation}>
                      {organisation === filterSelectTypes.UNSET ? <em>no organisation</em> : organisation}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Box>
            <Typography variant='caption'>
              <em>Last updated {formatDateStringWithMinutes(lastUpdated)}</em>
            </Typography>
          </Stack>
          <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant='contained' onClick={() => setDialogOpen(true)}>
              Export as PDF
            </Button>
            {showCsvExport && (
              <Button
                variant='contained'
                disabled={!onCsvExport || isCsvExporting}
                onClick={handleCsvExportOnClick}
                sx={{ minWidth: 140 }}
              >
                {isCsvExporting ? <CircularProgress size={24} color='inherit' /> : 'Export as CSV'}
              </Button>
            )}
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
