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

export abstract class BaseFileScanningConnector {
  abstract readonly toolName: string

  abstract info(): string[]
  abstract scan(file: FileInterface): Promise<FileScanResult[]>

  getScannerVersion(): Promise<string | void> {
    // default to promise undefined, but allow child classes to override this
    return Promise.resolve(undefined)
  }

  async scanError(error: unknown, file: FileInterface): Promise<FileScanResult[]> {
    const scannerVersion = await this.getScannerVersion()
    log.error({ error, modelId: file.modelId, fileId: file._id.toString(), name: file.name }, 'Scan errored.')
    return [
      {
        toolName: this.toolName,
        // include scannerVersion if it is defined
        ...(scannerVersion !== undefined ? { scannerVersion } : {}),
        state: ScanState.Error,
        lastRunAt: new Date(),
      },
    ]
  }
}
