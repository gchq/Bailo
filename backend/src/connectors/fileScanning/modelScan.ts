import { Response } from 'node-fetch'
import { Readable } from 'stream'

import { getModelScanInfo, scanFile } from '../../clients/modelScan.js'
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

    const { modelscanVersion } = await getModelScanInfo()

    const s3Stream = (await getObjectStream(file.bucket, file.path)).Body as Readable
    try {
      // TODO: see if it's possible to directly send the Readable stream rather than a blob
      const fileBlob = await new Response(s3Stream).blob()
      const scanResults = await scanFile(fileBlob, file.name)

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
          lastRunAt: new Date(),
        },
      ]
    }
  }
}
