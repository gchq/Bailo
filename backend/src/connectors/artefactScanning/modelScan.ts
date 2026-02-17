import PQueue from 'p-queue'

import { getModelScanInfo, scanStream } from '../../clients/modelScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ModelScanSummary, SeverityLevelKeys } from '../../models/Scan.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ArtefactBaseScanningConnector, ArtefactScanResult, ArtefactScanState, ArtefactType } from './Base.js'

export class ModelScanFileScanningConnector extends ArtefactBaseScanningConnector {
  queue: PQueue = new PQueue({ concurrency: config.artefactScanning.modelscan.concurrency })
  artefactType: ArtefactType = 'file'
  toolName: string = 'ModelScan'
  version: string | undefined = undefined

  constructor() {
    super()
  }

  async init() {
    const modelScanInfo = await getModelScanInfo()
    this.version = modelScanInfo.modelscanVersion
    return this
  }

  async _scan(file: FileInterfaceDoc): Promise<ArtefactScanResult[]> {
    await this.init()
    const scannerInfo = this.info()
    if (!scannerInfo.scannerVersion) {
      return await this.scanError('Could not use ModelScan as it is not running.', { ...scannerInfo })
    }

    const s3Stream = await getObjectStream(file.path)

    try {
      const scanResults = await scanStream(s3Stream, file.name)

      if (scanResults.errors.length !== 0) {
        return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
          errors: scanResults.errors,
          file,
          ...scannerInfo,
        })
      }

      const summary: ModelScanSummary[] = scanResults.issues.map(
        (issue) =>
          ({
            severity: issue.severity.toLowerCase() as SeverityLevelKeys,
            vulnerabilityDescription: `${issue.description}. (scanner: ${issue.scanner})`,
          }) as ModelScanSummary,
      )

      log.debug({ file, result: { summary }, ...scannerInfo }, 'Scan complete.')
      return [
        {
          ...scannerInfo,
          state: ArtefactScanState.Complete,
          summary,
          lastRunAt: new Date(),
        },
      ]
    } catch (error) {
      return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
        error: Error.isError(error) ? { name: error.name, stack: error.stack } : error,
        file,
      })
    } finally {
      if (s3Stream) {
        if (typeof s3Stream.destroy === 'function') {
          s3Stream.destroy()
        }
      }
    }
  }
}
