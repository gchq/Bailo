import PQueue from 'p-queue'

import { getArtefactScanInfo, scanStream } from '../../clients/artefactScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { BaseQueueFileScanningConnector, FileScanResult, ScanState } from './Base.js'

export class ArtefactScanFileScanningConnector extends BaseQueueFileScanningConnector {
  queue: PQueue = new PQueue({ concurrency: config.avScanning.artefactscan.concurrency })
  toolName: string = 'ArtefactScan'
  version: string | undefined = undefined

  constructor() {
    super()
  }

  async init() {
    const artefactScanInfo = await getArtefactScanInfo()
    this.version = artefactScanInfo.modelscanVersion
    return this
  }

  async _scan(file: FileInterfaceDoc): Promise<FileScanResult[]> {
    await this.init()
    const scannerInfo = this.info()
    if (!scannerInfo.scannerVersion) {
      return await this.scanError('Could not use ArtefactScan as it is not running.', { ...scannerInfo })
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

      const issues = scanResults.summary.total_issues
      const isInfected = issues > 0
      const viruses: string[] = isInfected
        ? scanResults.issues.map((issue) => `${issue.severity}: ${issue.description}. ${issue.scanner}`)
        : []
      log.debug({ file, result: { isInfected, viruses }, ...scannerInfo }, 'Scan complete.')
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
