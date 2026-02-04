import { Readable } from 'node:stream'
import { isNativeError } from 'node:util/types'

import PQueue from 'p-queue'

import { getModelScanInfo, scanStream } from '../../clients/modelScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ModelScanAdditionalInfo, ModelScanSummary, SeverityLevelKeys } from '../../models/Scan.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ArtefactScanResult, ArtefactScanState, ArtefactType, BaseQueueArtefactScanningConnector } from './Base.js'

export class ModelScanFileScanningConnector extends BaseQueueArtefactScanningConnector {
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

    const getObjectStreamResponse = await getObjectStream(file.path)
    const s3Stream = getObjectStreamResponse.Body as Readable | null
    if (!s3Stream) {
      return await this.scanError(`Stream for file ${file.path} is not available`, { file, ...scannerInfo })
    }

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

      const additionalInfo: ModelScanAdditionalInfo[] = scanResults.issues.map((issue) => issue)

      log.debug({ file, result: { summary, additionalInfo }, ...scannerInfo }, 'Scan complete.')
      return [
        {
          ...scannerInfo,
          state: ArtefactScanState.Complete,
          summary,
          additionalInfo,
          lastRunAt: new Date(),
        },
      ]
    } catch (error) {
      return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
        error: isNativeError(error) ? { name: error.name, stack: error.stack } : error,
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
