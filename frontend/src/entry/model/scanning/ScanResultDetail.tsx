import { BlockOutlined, Done, Error as ErrorIcon, HourglassTop, Warning } from '@mui/icons-material'
import { Chip, Stack, Typography } from '@mui/material'
import { ReactElement } from 'react'
import { ArtefactScanState, ClamAVSummary, ModelScanSummary, ScanResultInterface } from 'types/types'
import { formatDateTimeString } from 'utils/dateUtils'

interface ScanResultDetailProps {
  scanResult: ScanResultInterface
}

/**
 * Renders a single scanner's result block inside the popover.
 * Uses the scanner's own state (not the aggregated state) so each row shows the correct icon/wording for that individual tool.
 */
export default function ScanResultDetail({ scanResult }: ScanResultDetailProps) {
  const hasFindings = !!scanResult.summary && scanResult.summary.length > 0
  const { state, toolName, scannerVersion, lastRunAt, summary } = scanResult

  const renderHeader = (): ReactElement => {
    if (hasFindings) {
      if (state === ArtefactScanState.Skipped) {
        return (
          <>
            <BlockOutlined color='action' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> was skipped:
            </Typography>
          </>
        )
      }
      return (
        <>
          <ErrorIcon color='error' />
          <Typography>
            <span style={{ fontWeight: 'bold' }}>{toolName}</span> found the following:
          </Typography>
        </>
      )
    }

    switch (state) {
      case ArtefactScanState.InProgress:
        return (
          <>
            <HourglassTop color='warning' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> is currently running
            </Typography>
          </>
        )
      case ArtefactScanState.NotScanned:
      case ArtefactScanState.Error:
        return (
          <>
            <Warning color='warning' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> could not be run
            </Typography>
          </>
        )
      case ArtefactScanState.Skipped:
        return (
          <>
            <BlockOutlined color='action' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> was skipped
            </Typography>
          </>
        )
      case ArtefactScanState.Complete:
      default:
        return (
          <>
            <Done color='success' />
            <Typography>
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> found no issues
            </Typography>
          </>
        )
    }
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={1} direction='row' alignItems='center'>
        {renderHeader()}
      </Stack>
      {scannerVersion && (
        <Chip
          size='small'
          variant='outlined'
          sx={{ width: 'fit-content' }}
          label={`Scanner version: ${scannerVersion}`}
        />
      )}
      <Typography>Last ran at: {formatDateTimeString(lastRunAt)}</Typography>
      {hasFindings && summary && (
        <ul>
          {summary.map((vulnerability) => {
            if (typeof vulnerability === 'string') {
              return <li key={vulnerability}>{vulnerability}</li>
            }
            if (toolName === 'ModelScan') {
              const v = vulnerability as ModelScanSummary
              return (
                <li key={v.vulnerabilityDescription}>
                  <span style={{ fontWeight: 'bold' }}>{`${String(v.severity).toUpperCase()}:`}</span>{' '}
                  {v.vulnerabilityDescription}
                </li>
              )
            }
            const v = vulnerability as ClamAVSummary
            return <li key={v.virus}>{`Virus found: ${v.virus}`}</li>
          })}
        </ul>
      )}
    </Stack>
  )
}
