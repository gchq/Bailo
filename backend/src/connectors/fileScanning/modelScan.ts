import { Readable } from 'stream'

import { getModelScanInfo, scanStream } from '../../clients/modelScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector, FileScanResult, ScanState } from './Base.js'

export class ModelScanFileScanningConnector extends BaseFileScanningConnector {
  constructor() {
    super()
  }

  async info() {
    return { toolName: 'ModelScan', scannerVersion: await this.getScannerVersion() }
  }

  async getScannerVersion() {
    const modelScanInfo = await getModelScanInfo()
    return modelScanInfo.modelscanVersion
  }

  async init(retryCount: number = 1) {
    log.info('Initialising ModelScan...')
    if (retryCount <= config.connectors.fileScanners.maxInitRetries) {
      setTimeout(async () => {
        try {
          await getModelScanInfo()
          log.info('ModelScan initialised.')
        } catch (_error) {
          log.warn(`Could not initialise ModelScan, retrying (attempt ${retryCount})...`)
          this.init(++retryCount)
        }
      }, config.connectors.fileScanners.initRetryDelay)
    } else {
      throw ConfigurationError(
        `Could not initialise Model Scan after ${retryCount} attempts, make sure that it is setup and configured correctly.`,
        {
          modelScanConfig: config.avScanning.modelscan,
        },
      )
    }
  }

  async scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    this.init()
    const scannerInfo = await this.info()
    if (scannerInfo.scannerVersion === undefined) {
      return await this.scanError(undefined, undefined, 'Could not use ModelScan as it is not running')
    }

    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    try {
      const scanResults = await scanStream(s3Stream, file.name, file.size)

      if (scanResults.errors.length !== 0) {
        return this.scanError(scanResults.errors, file)
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
      return this.scanError(error, file)
    }
  }
}
