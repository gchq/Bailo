import { FileInterface } from '../../models/File.js'
export interface FileScanResult {
  toolName: string
  scannerVersion?: string
  state: ScanStateKeys
  isInfected?: boolean
  viruses?: string[]
  lastRunAt: Date
}

export const ScanState = {
  NotScanned: 'notScanned',
  InProgress: 'inProgress',
  Complete: 'complete',
  Error: 'error',
} as const
export type ScanStateKeys = (typeof ScanState)[keyof typeof ScanState]

export abstract class BaseFileScanningConnector {
  abstract info(): string[]
  abstract scan(file: FileInterface): Promise<FileScanResult[]>
}
