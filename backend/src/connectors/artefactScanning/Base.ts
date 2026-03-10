import PQueue from 'p-queue'

import { FileInterface } from '../../models/File.js'
import { ImageRefInterface } from '../../models/Release.js'
import { ArtefactKindKeys, ScanInterface } from '../../models/Scan.js'
import log from '../../services/log.js'

export type ArtefactScanResult = Pick<
  ScanInterface,
  'toolName' | 'scannerVersion' | 'state' | 'summary' | 'additionalInfo' | 'lastRunAt' | 'artefactKind'
>

export type LayerRefInterface = ImageRefInterface & { layerDigest: string }
export type ArtefactInterface = FileInterface | LayerRefInterface

export const ArtefactScanState = {
  NotScanned: 'notScanned',
  InProgress: 'inProgress',
  Complete: 'complete',
  Error: 'error',
} as const
export type ArtefactScanStateKeys = (typeof ArtefactScanState)[keyof typeof ArtefactScanState]

export type ArtefactScanningConnectorInfo = Pick<ArtefactScanResult, 'toolName' | 'scannerVersion' | 'artefactKind'>

export abstract class BaseArtefactScanningConnector {
  abstract readonly toolName: string
  abstract readonly version: string | undefined
  abstract readonly artefactType: ArtefactKindKeys

  abstract readonly queue: PQueue

  info(): ArtefactScanningConnectorInfo {
    return { toolName: this.toolName, scannerVersion: this.version, artefactKind: this.artefactType }
  }

  abstract init()

  abstract _scan(artefact: ArtefactInterface): Promise<ArtefactScanResult>

  async scan(artefact: ArtefactInterface): Promise<ArtefactScanResult> {
    log.debug({ artefact, ...this.info(), queueSize: this.queue.size }, 'Queueing scan.')
    const scanResult = await this.queue
      .add(() => this._scan(artefact))
      .catch((error) => {
        return this.scanError('Queued scan threw an error.', { error, artefact })
      })
    // return type of `queue.add()` is Promise<void | ...> so reject void responses
    if (scanResult === null || typeof scanResult !== 'object') {
      return this.scanError('Queued scan failed to correctly return.', { artefact })
    }
    return scanResult
  }

  async scanError(message: string, context?: object): Promise<ArtefactScanResult> {
    const scannerInfo = this.info()
    log.error({ ...context, ...scannerInfo }, message)
    return {
      ...scannerInfo,
      state: ArtefactScanState.Error,
      lastRunAt: new Date(),
    }
  }
}
