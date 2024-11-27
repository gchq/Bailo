import { FileInterface, ScanStateKeys } from '../../models/File.js'
export interface FileScanResult {
  toolName: string
  scannerVersion?: string
  state: ScanStateKeys
  isInfected?: boolean
  viruses?: string[]
  lastRunAt: Date
}

export abstract class BaseFileScanningConnector {
  abstract info(): string[]
  abstract scan(file: FileInterface): Promise<FileScanResult[]>
}
