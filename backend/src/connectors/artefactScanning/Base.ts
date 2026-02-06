import PQueue from 'p-queue'

import { FileInterface } from '../../models/File.js'
import { ImageRefInterface } from '../../models/Release.js'
import { ScanInterface } from '../../models/Scan.js'
import log from '../../services/log.js'

//TODO Remove file-specific mentions, but do I replace with artefact? or keep bare?

export type ArtefactScanResult = Pick<
  ScanInterface,
  'toolName' | 'scannerVersion' | 'state' | 'summary' | 'additionalInfo' | 'lastRunAt'
>

//TODO this may need to change
export type ArtefactInterface = FileInterface | ImageRefInterface

export const ArtefactScanState = {
  NotScanned: 'notScanned',
  InProgress: 'inProgress',
  Complete: 'complete',
  Error: 'error',
} as const
export type ArtefactScanStateKeys = (typeof ArtefactScanState)[keyof typeof ArtefactScanState]

export type ArtefactScanningConnectorInfo = Pick<ArtefactScanResult, 'toolName' | 'scannerVersion'>

export type ArtefactType = 'file' | 'image'

export abstract class ArtefactBaseScanningConnector {
  abstract readonly toolName: string
  abstract readonly version: string | undefined

  abstract init()
  abstract scan(artefact: ArtefactInterface): Promise<ArtefactScanResult[]>

  info(): ArtefactScanningConnectorInfo {
    return { toolName: this.toolName, scannerVersion: this.version }
  }

  async scanError(message: string, context?: object): Promise<ArtefactScanResult[]> {
    const scannerInfo = this.info()
    log.error({ ...context, ...scannerInfo }, message)
    return [
      {
        ...scannerInfo,
        state: ArtefactScanState.Error,
        lastRunAt: new Date(),
      },
    ]
  }
}

export abstract class BaseQueueArtefactScanningConnector extends ArtefactBaseScanningConnector {
  abstract readonly queue: PQueue
  abstract artefactType: ArtefactType

  abstract _scan(artefact: ArtefactInterface): Promise<ArtefactScanResult[]>

  async scan(artefact: ArtefactInterface): Promise<ArtefactScanResult[]> {
    log.debug({ artefact, ...this.info(), queueSize: this.queue.size }, 'Queueing scan.')
    const scanResults = await this.queue
      .add(() => this._scan(artefact))
      .catch((error) => {
        return this.scanError('Queued scan threw an error.', { error, artefact })
      })
    // return type of `queue.add()` is Promise<void | ...> so reject void responses
    if (scanResults === null || typeof scanResults !== 'object') {
      return this.scanError('Queued scan failed to correctly return.', { artefact })
    }
    return scanResults
  }
}
