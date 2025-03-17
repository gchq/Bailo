import { FileInterface } from '../../models/File.js'
import { ScanInterface } from '../../models/Scan.js'
export type FileScanResult = Pick<
  ScanInterface,
  'toolName' | 'scannerVersion' | 'state' | 'isInfected' | 'viruses' | 'lastRunAt'
>

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
