import { FileInterface, ScanStateKeys } from '../../models/File.js'
export interface FileScanResult {
  toolName: string
  state: ScanStateKeys
  isInfected?: boolean
  viruses?: string[]
}

export abstract class BaseFileScanningConnector {
  abstract info(): string[]
  abstract scan(file: FileInterface): Promise<FileScanResult[]>
}
