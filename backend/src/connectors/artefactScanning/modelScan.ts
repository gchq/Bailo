import PQueue from 'p-queue'

import { getCachedArtefactScanInfo, ModelScanResponse, scanFileStream } from '../../clients/artefactScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ArtefactKind, ArtefactKindKeys, ArtefactScanSummary, SeverityLevelKeys } from '../../models/Scan.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ArtefactScanResult, ArtefactScanState, BaseArtefactScanningConnector } from './Base.js'

const skippedScanTemplate: ModelScanResponse = {
  summary: {
    total_issues: 0,
    total_issues_by_severity: {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    },
    input_path: '/tmp/fileName.extension',
    absolute_path: '/tmp',
    modelscan_version: 'x.y.z',
    timestamp: 'YYYY-MM-DDTHH:mm:ss.ssssss',
    scanned: {
      total_scanned: 0,
    },
    skipped: {
      total_skipped: 1,
      skipped_files: [
        {
          category: 'SCAN_NOT_SUPPORTED',
          description: 'Model Scan did not scan file',
          source: 'fileName.extension',
        },
      ],
    },
  },
  issues: [],
  errors: [],
}

function formatDate(date = new Date()) {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  // Convert milliseconds (3 digits) to microseconds (6 digits)
  const microseconds = pad(date.getMilliseconds() * 1000, 6)

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${microseconds}`
}

export class ModelScanFileScanningConnector extends BaseArtefactScanningConnector {
  readonly queue: PQueue = new PQueue({ concurrency: config.artefactScanning.artefactscan.concurrency })
  artefactType: ArtefactKindKeys = ArtefactKind.FILE
  toolName: string = 'ModelScan'
  supportedExtensions?: string[]
  maxFileSizeBytes?: number

  async init() {
    if (!(this.version && this.supportedExtensions && this.maxFileSizeBytes)) {
      const artefactScanInfo = await getCachedArtefactScanInfo()
      this.version = artefactScanInfo.modelscanVersion
      this.supportedExtensions = artefactScanInfo.modelscanSupportedExtensions ?? []
      this.maxFileSizeBytes = artefactScanInfo.maxFileSizeBytes ?? Infinity
    }
    return this
  }

  async getSkippedScanSummary(file: FileInterfaceDoc): Promise<ModelScanResponse> {
    await this.init()
    const skippedScanSummary = structuredClone(skippedScanTemplate)
    skippedScanSummary.summary.input_path = `/tmp/${file.name}`
    skippedScanSummary.summary.timestamp = formatDate()
    skippedScanSummary.summary.modelscan_version = this.version!
    skippedScanSummary.summary.skipped.skipped_files![0].source = file.name

    return skippedScanSummary
  }

  async _scan(file: FileInterfaceDoc): Promise<ArtefactScanResult> {
    await this.init()
    const scannerInfo = this.info()
    if (!scannerInfo.scannerVersion) {
      return await this.scanError('Could not use ArtefactScan as it is not running.', { ...scannerInfo })
    }

    if (
      file.size > this.maxFileSizeBytes! ||
      (this.supportedExtensions!.length > 0 &&
        !this.supportedExtensions!.some((supportedExtension) => file.name.endsWith(supportedExtension)))
    ) {
      const additionalInfo = await this.getSkippedScanSummary(file)
      log.debug({ file, result: { additionalInfo }, ...scannerInfo }, 'Skipping file scan.')
      return {
        ...scannerInfo,
        state: ArtefactScanState.Complete,
        summary: [],
        additionalInfo,
        lastRunAt: new Date(),
      }
    }

    const s3Stream = await getObjectStream(file.path)

    try {
      const scanResults = await scanFileStream(s3Stream, file.name)

      if (scanResults.errors.length !== 0) {
        return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
          errors: scanResults.errors,
          file,
          ...scannerInfo,
        })
      }

      const summary: ArtefactScanSummary[] = scanResults.issues.map(
        (issue) =>
          ({
            severity: issue.severity.toLowerCase() as SeverityLevelKeys,
            vulnerabilityDescription: `${issue.description}. (scanner: ${issue.scanner})`,
          }) as ArtefactScanSummary,
      )

      log.debug({ file, result: { summary }, ...scannerInfo }, 'Scan complete.')
      return {
        ...scannerInfo,
        state: ArtefactScanState.Complete,
        summary,
        additionalInfo: scanResults,
        lastRunAt: new Date(),
      }
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
