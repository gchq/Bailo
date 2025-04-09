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
  abstract info(): Promise<FileScanningConnectorInfo>
  abstract scan(file: FileInterface): Promise<FileScanResult[]>

  async scanError(
    error: unknown | undefined = undefined,
    file: FileInterface | undefined = undefined,
    errorMessage: string = 'Scan errored.',
    extraErrorObj: object = {},
  ): Promise<FileScanResult[]> {
    const scannerInfo = await this.info()
    log.error(
      {
        // conditional spreading operator so that objects are only used if they exist
        ...(error !== undefined ? { error } : {}),
        ...(file !== undefined ? { modelId: file.modelId, fileId: file._id.toString(), name: file.name } : {}),
        ...extraErrorObj,
      },
      errorMessage,
    )
    return [
      {
        ...scannerInfo,
        state: ScanState.Error,
        lastRunAt: new Date(),
      },
    ]
  }
}
