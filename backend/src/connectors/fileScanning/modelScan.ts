import { Readable } from 'stream'

import { getModelScanInfo, scanStream } from '../../clients/modelScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import log from '../../services/log.js'
import { BaseFileScanningConnector, FileScanResult, ScanState } from './Base.js'

export class ModelScanFileScanningConnector extends BaseFileScanningConnector {
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

  async scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    await this.init()
    const scannerInfo = this.info()
    if (!scannerInfo.scannerVersion) {
      return await this.scanError('Could not use ModelScan as it is not running.')
    }

    const getObjectStreamResponse = await getObjectStream(file.path)
    const s3Stream = getObjectStreamResponse.Body as Readable | null
    if (!s3Stream) {
      return await this.scanError(`Stream for file ${file.path} is not available`)
    }

    try {
      const scanResults = await scanStream(s3Stream, file.name)

      if (scanResults.errors.length !== 0) {
        log.error('Errors during file scan', { scanResults, file, toolName: this.toolName })
        return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
          errors: scanResults.errors,
          file,
        })
      }

      const issues = scanResults.summary.total_issues
      const isInfected = issues > 0
      const viruses: string[] = isInfected
        ? scanResults.issues.map((issue) => `${issue.severity}: ${issue.description}. ${issue.scanner}`)
        : []
      log.info(
        { modelId: file.modelId, fileId: file._id.toString(), name: file.name, result: { isInfected, viruses } },
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
      log.error('Error during file scan', { error, file, toolName: this.toolName })
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
