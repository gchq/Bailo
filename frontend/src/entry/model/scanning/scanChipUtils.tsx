import BlockOutlined from '@mui/icons-material/BlockOutlined'
import Done from '@mui/icons-material/Done'
import ErrorIcon from '@mui/icons-material/Error'
import HourglassTop from '@mui/icons-material/HourglassTop'
import Warning from '@mui/icons-material/Warning'
import { ReactElement } from 'react'
import { ArtefactScanState, ArtefactScanStateKeys, ScanResultInterface } from 'types/types'
import { plural } from 'utils/stringUtils'

export interface ChipDetails {
  label: string
  colour: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  icon: ReactElement
}

/**
 * Ordering used when reducing multiple scan states down to a single "worst-case" state.
 * Earlier entries take precedence over later ones.
 */
export const SCAN_STATE_PRECEDENCE: ArtefactScanStateKeys[] = [
  ArtefactScanState.InProgress,
  ArtefactScanState.NotScanned,
  ArtefactScanState.Error,
  ArtefactScanState.Skipped,
  ArtefactScanState.Complete,
]

export function countFindings(scanResults: ScanResultInterface[] | undefined): number {
  if (!scanResults) {
    return 0
  }
  return scanResults.reduce((acc, scan) => acc + (scan.summary?.length ?? 0), 0)
}

/**
 * Returns the worst-case state across all scan results, or `undefined` if there are no scan results at all.
 */
export function getWorstScanState(scanResults: ScanResultInterface[] | undefined): ArtefactScanStateKeys | undefined {
  if (!scanResults || scanResults.length === 0) {
    return undefined
  }
  const states = new Set(scanResults.map((r) => r.state))
  return SCAN_STATE_PRECEDENCE.find((state) => states.has(state))
}

/**
 * Returns whether any scan result is currently in progress.
 */
export function isAnyScanInProgress(scanResults: ScanResultInterface[] | undefined): boolean {
  return scanResults?.some((res) => res.state === ArtefactScanState.InProgress) ?? false
}

/**
 * Returns whether there are any scan results.
 */
export function isAnyScanResults(scanResults: ScanResultInterface[] | undefined): boolean {
  return Boolean(scanResults && scanResults.length)
}

/**
 * Derive the chip details from the worst-case scan state and total findings.
 */
export function buildChipDetails(scanResults: ScanResultInterface[] | undefined): ChipDetails {
  if (scanResults === undefined) {
    return { label: 'Scan results could not be found', colour: 'warning', icon: <Warning /> }
  }

  const worst = getWorstScanState(scanResults)
  const findings = countFindings(scanResults)
  const worstCount = scanResults.filter((s) => s.state === worst).length

  switch (worst) {
    case ArtefactScanState.InProgress:
      return {
        label: `${plural(worstCount, 'scan')} remaining`,
        colour: 'warning',
        icon: <HourglassTop />,
      }
    case ArtefactScanState.NotScanned:
      return { label: `${worstCount} not scanned`, colour: 'warning', icon: <Warning /> }
    case ArtefactScanState.Error:
      return findings > 0
        ? {
            label: `${plural(findings, 'finding')} detected`,
            colour: 'error',
            icon: <ErrorIcon />,
          }
        : { label: `${plural(worstCount, 'scanning tool')} failed`, colour: 'error', icon: <ErrorIcon /> }
    case ArtefactScanState.Skipped:
      return { label: `${plural(worstCount, 'scan')} skipped`, colour: 'default', icon: <BlockOutlined /> }
    case ArtefactScanState.Complete:
      return findings > 0
        ? {
            label: `${plural(findings, 'finding')} detected`,
            colour: 'error',
            icon: <ErrorIcon />,
          }
        : { label: 'No issues found', colour: 'success', icon: <Done /> }
    default:
      return {
        label: 'There was a problem fetching the file scan results',
        colour: 'error',
        icon: <Warning />,
      }
  }
}
