import PQueue from 'p-queue'
import { Readable } from 'stream'

import { getModelScanInfo, scanStream } from '../../clients/modelScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { BaseQueueFileScanningConnector, FileScanResult, ScanState } from './Base.js'

export class ModelScanFileScanningConnector extends BaseQueueFileScanningConnector {
  queue: PQueue = new PQueue({ concurrency: config.avScanning.modelscan.concurrency })
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

  async _scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
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

      const issues = scanResults.summary.total_issues
      const isInfected = issues > 0
      const viruses: string[] = isInfected
        ? scanResults.issues.map((issue) => `${issue.severity}: ${issue.description}. ${issue.scanner}`)
        : []
      log.debug(
        { file, result: { isInfected, viruses }, ...scannerInfo },
        'Scan complete.',
      )
      return [
        {
          ...scannerInfo,
          state: ScanState.Complete,
          isInfected,
          viruses,
          lastRunAt: new Date(),
        },
      ]
    } catch (error) {
      return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
        error,
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
