import { FileInterface } from '../../models/File.js'
import { ScanInterface } from '../../models/Scan.js'
import log from '../../services/log.js'
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

export type FileScanningConnectorInfo = Pick<FileScanResult, 'toolName' | 'scannerVersion'>

export abstract class BaseFileScanningConnector {
  abstract toolName: string
  abstract version: string | undefined

  abstract init()
  abstract scan(file: FileInterface): Promise<FileScanResult[]>

  info(): FileScanningConnectorInfo {
    return { toolName: this.toolName, scannerVersion: this.version }
  }

  async scanError(message: string, context?: object): Promise<FileScanResult[]> {
    const scannerInfo = await this.info()
    log.error({ ...context, ...scannerInfo }, message)
    return [
      {
        ...scannerInfo,
        state: ScanState.Error,
        lastRunAt: new Date(),
      },
    ]
  }
}
