import { Readable } from 'stream'

import { getModelScanInfo, scanStream } from '../../clients/modelScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc, ScanState } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector, FileScanResult } from './Base.js'

export const modelScanToolName = 'ModelScan'

export class ModelScanFileScanningConnector extends BaseFileScanningConnector {
  constructor() {
    super()
  }

  info() {
    return [modelScanToolName]
  }

  async ping() {
    try {
      // discard the results as we only want to know if the endpoint is reachable
      await getModelScanInfo()
    } catch (error) {
      throw ConfigurationError(
        'ModelScan does not look like it is running. Check that the service configuration is correct.',
        {
          modelScanConfig: config.avScanning.modelscan,
        },
      )
    }
  }

  async scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    this.ping()

    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    try {
      const scanResults = await scanStream(s3Stream, file.name, file.size)

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
          isInfected,
          viruses,
        },
      ]
    } catch (error) {
      log.error({ error, modelId: file.modelId, fileId: file._id, name: file.name }, 'Scan errored.')
      return [
        {
          toolName: modelScanToolName,
          state: ScanState.Error,
        },
      ]
    }
  }
}
