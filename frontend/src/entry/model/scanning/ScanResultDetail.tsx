import BlockOutlined from '@mui/icons-material/BlockOutlined'
import Done from '@mui/icons-material/Done'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassTop from '@mui/icons-material/HourglassTop'
import Warning from '@mui/icons-material/Warning'
import { Chip, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
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
              <span style={{ fontWeight: 'bold' }}>{toolName}</span> was skipped
            </Typography>
          </>
        )
      }
      return (
        <>
          <ErrorIcon color='error' />
          <Typography>
            <span style={{ fontWeight: 'bold' }}>{toolName}</span> found the following
          </Typography>
        </>
      )
    }

    const stateMap = {
      [ArtefactScanState.InProgress]: {
        Icon: HourglassTop,
        color: 'warning',
        text: 'is currently running',
      },
      [ArtefactScanState.NotScanned]: {
        Icon: Warning,
        color: 'warning',
        text: 'could not be run',
      },
      [ArtefactScanState.Error]: {
        Icon: Warning,
        color: 'warning',
        text: 'could not be run',
      },
      [ArtefactScanState.Skipped]: {
        Icon: BlockOutlined,
        color: 'action',
        text: 'was skipped',
      },
      [ArtefactScanState.Complete]: {
        Icon: Done,
        color: 'success',
        text: 'found no issues',
      },
    } as const
    const { Icon, color, text } = stateMap[state] ?? stateMap[ArtefactScanState.Complete]

    return (
      <>
        <Icon color={color} />
        <Typography>
          <span style={{ fontWeight: 'bold' }}>{toolName}</span> {text}
        </Typography>
      </>
    )
  }

  const renderFindingItem = (vulnerability: ModelScanSummary | ClamAVSummary | string): ReactElement => {
    if (typeof vulnerability === 'string') {
      return (
        <ListItem key={vulnerability} sx={{ display: 'list-item', py: 0 }}>
          <ListItemText primary={vulnerability} />
        </ListItem>
      )
    }

    if (toolName === 'ModelScan') {
      const v = vulnerability as ModelScanSummary
      return (
        <ListItem key={v.vulnerabilityDescription} sx={{ display: 'list-item', py: 0 }}>
          <ListItemText
            primary={
              <>
                <span style={{ fontWeight: 'bold' }}>{`${String(v.severity).toUpperCase()}:`}</span>{' '}
                {v.vulnerabilityDescription}
              </>
            }
          />
        </ListItem>
      )
    }

    const v = vulnerability as ClamAVSummary
    return (
      <ListItem key={v.virus} sx={{ display: 'list-item', py: 0 }}>
        <ListItemText primary={`Virus found: ${v.virus}`} />
      </ListItem>
    )
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={1} direction='row' sx={{ alignItems: 'center' }}>
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
        <List sx={{ listStyleType: 'disc', pl: 2, py: 0 }}>
          {summary.map((vulnerability) => renderFindingItem(vulnerability))}
        </List>
      )}
    </Stack>
  )
}
