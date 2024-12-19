import { Readable } from 'stream'

import { getModelScanInfo, scanStream } from '../../clients/modelScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector, FileScanResult, ScanState } from './Base.js'

export const modelScanToolName = 'ModelScan'

export class ModelScanFileScanningConnector extends BaseFileScanningConnector {
  constructor() {
    super()
  }

  info() {
    return [modelScanToolName]
  }

  async init(retryCount: number = 1) {
    log.info('Initialising ModelScan...')
    if (retryCount <= config.connectors.fileScanners.maxInitRetries) {
      setTimeout(async () => {
        try {
          await getModelScanInfo()
          log.info('ModelScan initialised.')
        } catch (error) {
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

    let modelscanVersion: string | undefined = undefined
    try {
      modelscanVersion = (await getModelScanInfo()).modelscanVersion
    } catch (error) {
      log.error('Could not run ModelScan as it is not running', error)
      return [
        {
          toolName: modelScanToolName,
          scannerVersion: 'Unknown',
          state: ScanState.Error,
          lastRunAt: new Date(),
        },
      ]
    }

    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    try {
      const scanResults = await scanStream(s3Stream, file.name, file.size)

      if (scanResults.errors.length !== 0) {
        log.error(
          { errors: scanResults.errors, modelId: file.modelId, fileId: file._id, name: file.name },
          'Scan errored.',
        )
        return [
          {
            toolName: modelScanToolName,
            state: ScanState.Error,
            scannerVersion: modelscanVersion,
            lastRunAt: new Date(),
          },
        ]
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
        { modelId: file.modelId, fileId: file._id, name: file.name, result: { isInfected, viruses } },
        'Scan complete.',
      )
      return [
        {
          toolName: modelScanToolName,
          state: ScanState.Complete,
          scannerVersion: modelscanVersion,
          isInfected,
          viruses,
          lastRunAt: new Date(),
        },
      ]
    } catch (error) {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan errored.')
      return [
        {
          toolName: modelScanToolName,
          state: ScanState.Error,
          scannerVersion: modelscanVersion,
          lastRunAt: new Date(),
        },
      ]
    }
  }
}
