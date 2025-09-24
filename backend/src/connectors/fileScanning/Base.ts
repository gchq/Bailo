import PQueue from 'p-queue'

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
  abstract readonly toolName: string
  abstract readonly version: string | undefined

  abstract init()
  abstract scan(file: FileInterface): Promise<FileScanResult[]>

  info(): FileScanningConnectorInfo {
    return { toolName: this.toolName, scannerVersion: this.version }
  }

  async scanError(message: string, context?: object): Promise<FileScanResult[]> {
    const scannerInfo = this.info()
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

export abstract class BaseQueueFileScanningConnector extends BaseFileScanningConnector {
  abstract readonly queue: PQueue

  abstract _scan(file: FileInterface): Promise<FileScanResult[]>

  async scan(file: FileInterface): Promise<FileScanResult[]> {
    log.debug({ file, toolName: this.toolName, ...(this.version && { version: this.version }) }, 'Queueing scan.')
    const scanResult = await this.queue
      .add(async () => this._scan(file))
      .catch((error) => {
        return this.scanError('Queued scan threw an error.', { error, file })
      })
    // return type of `queue.add()` is Promise<void | ...> so reject void responses
    if (scanResult === null || typeof scanResult !== 'object') {
      return this.scanError('Queued scan failed to correctly return.', { file })
    }
    return scanResult
  }
}
