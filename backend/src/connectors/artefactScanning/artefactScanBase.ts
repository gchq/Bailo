import PQueue from 'p-queue'

import config from '../../utils/config.js'
import { BaseArtefactScanningConnector } from './Base.js'

export abstract class ArtefactScanBaseScanningConnector extends BaseArtefactScanningConnector {
  queue: PQueue = new PQueue({ concurrency: config.artefactScanning.artefactscan.concurrency })
  version: string | undefined = undefined

  constructor() {
    super()
  }
}
