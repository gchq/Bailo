import bytes from 'bytes'
import PQueue from 'p-queue'

import { FileInterface } from '../../models/File.js'
import { ImageRef } from '../../models/Release.js'
import { ArtefactKindKeys, ScanInterface } from '../../models/Scan.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'

export type ArtefactScanResult = Pick<
  ScanInterface,
  'toolName' | 'scannerVersion' | 'state' | 'summary' | 'additionalInfo' | 'lastRunAt' | 'artefactKind'
>

export type LayerRefInterface = ImageRef & { layerDigest: string }
export type ArtefactInterface = FileInterface | LayerRefInterface

export const ArtefactScanState = {
  NotScanned: 'notScanned',
  InProgress: 'inProgress',
  Complete: 'complete',
  Skipped: 'skipped',
  Error: 'error',
} as const
export type ArtefactScanStateKeys = (typeof ArtefactScanState)[keyof typeof ArtefactScanState]

export type ArtefactScanningConnectorInfo = Pick<ArtefactScanResult, 'toolName' | 'scannerVersion' | 'artefactKind'>

export abstract class BaseArtefactScanningConnector {
  abstract readonly toolName: string
  abstract readonly artefactType: ArtefactKindKeys
  abstract readonly queue: PQueue

  protected version?: string
  protected maxSize: number = Infinity

  getConnectorInfo(): ArtefactScanningConnectorInfo {
    return { toolName: this.toolName, scannerVersion: this.version, artefactKind: this.artefactType }
  }

  abstract init(): Promise<void>

  protected abstract executeScan(artefact: ArtefactInterface): Promise<ArtefactScanResult>

  async scan(artefact: ArtefactInterface): Promise<ArtefactScanResult> {
    if (!this.version) {
      return this.buildErrorResult(`${this.toolName} used before initialisation`, { artefact })
    }

    log.debug({ artefact, ...this.getConnectorInfo(), queueSize: this.queue.size }, 'Queueing scan.')
    const scanResult = await this.queue
      .add(() => this.executeScanWithTimeout(artefact, config.connectors.artefactScanners.scanTimeoutMs))
      .catch((error) => {
        return this.buildErrorResult('Queued scan threw an error.', { error, artefact })
      })
    // return type of `queue.add()` is Promise<void | ...> so reject void responses
    if (scanResult === null || typeof scanResult !== 'object') {
      return this.buildErrorResult('Queued scan failed to correctly return.', { artefact })
    }
    return scanResult
  }

  protected buildErrorResult(message: string, context?: Record<string, unknown>): ArtefactScanResult {
    const scannerInfo = this.getConnectorInfo()
    log.error({ ...context, ...scannerInfo }, message)
    return {
      ...scannerInfo,
      summary: [message],
      state: ArtefactScanState.Error,
      lastRunAt: new Date(),
    }
  }

  protected buildSkipResult(reason: string | string[]): ArtefactScanResult {
    const scannerInfo = this.getConnectorInfo()
    return {
      ...scannerInfo,
      summary: typeof reason === 'string' ? [reason] : reason,
      state: ArtefactScanState.Skipped,
      lastRunAt: new Date(),
    }
  }

  protected buildSizeExceededResult(artefact: ArtefactInterface, artefactSize: number): ArtefactScanResult {
    return this.buildErrorResult('Artefact exceeds configured scanner size limit.', {
      artefact,
      artefactSize: bytes.format(artefactSize),
      maxSize: bytes.format(this.maxSize),
    })
  }

  private async executeScanWithTimeout(artefact: ArtefactInterface, timeoutMs: number): Promise<ArtefactScanResult> {
    let timeout: ReturnType<typeof setTimeout>

    const timeoutPromise = new Promise<ArtefactScanResult>((resolve) => {
      timeout = setTimeout(() => {
        resolve(this.buildErrorResult('Scan timeout exceeded.', { artefact, timeoutMs: timeoutMs }))
      }, timeoutMs)
    })

    try {
      return await Promise.race([this.executeScan(artefact), timeoutPromise])
    } finally {
      // Clear timeout after race promise as resolved.
      // Prevents scenario of any additional 'timeout' errors appearing after the fact.
      clearTimeout(timeout!)
    }
  }
}
