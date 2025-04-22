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
    this.init()
    const scannerInfo = await this.info()
    if (scannerInfo.scannerVersion === undefined) {
      return await this.scanError('Could not use ModelScan as it is not running.')
    }

    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    try {
      const scanResults = await scanStream(s3Stream, file.name, file.size)

      if (scanResults.errors.length !== 0) {
        return this.scanError(`Unable to scan file. ${this.toolName} errored.`, { errors: scanResults.errors, file })
      }

      const issues = scanResults.summary.total_issues
      const isInfected = issues > 0
      const viruses: string[] = []
      if (isInfected) {
        for (const issue of scanResults.issues) {
          viruses.push(`${issue.severity}: ${issue.description}. ${issue.scanner}`)
        }
      }
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
      return this.scanError(`Unable to scan file. ${this.toolName} errored.`, { error, file })
    }
  }
}
