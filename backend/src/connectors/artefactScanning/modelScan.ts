import PQueue from 'p-queue'

import { getCachedArtefactScanInfo, scanFileStream } from '../../clients/artefactScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ArtefactKind, ArtefactKindKeys, ArtefactScanSummary, SeverityLevelKeys } from '../../models/Scan.js'
import log from '../../services/log.js'
import { isBailoError } from '../../types/error.js'
import config from '../../utils/config.js'
import { ArtefactScanResult, ArtefactScanState, BaseArtefactScanningConnector } from './Base.js'

const UNSUPPORTED_FILE_TYPE_MESSAGE = 'File type is not compatible with this scanner.'
const TOOL_NAME = 'ModelScan'
export function isScanAllowedSkip(scan: ArtefactScanResult): boolean {
  return (
    (scan.state === ArtefactScanState.Skipped &&
      scan.toolName === TOOL_NAME &&
      scan.summary?.includes(UNSUPPORTED_FILE_TYPE_MESSAGE)) ||
    false
  )
}

export class ModelScanFileScanningConnector extends BaseArtefactScanningConnector {
  readonly queue: PQueue = new PQueue({ concurrency: config.artefactScanning.artefactscan.concurrency })
  readonly artefactType: ArtefactKindKeys = ArtefactKind.FILE
  readonly toolName: string = TOOL_NAME
  protected supportedExtensions: string[] = []

  async init(): Promise<void> {
    const artefactScanInfo = await getCachedArtefactScanInfo()

    this.version = artefactScanInfo.modelscanVersion
    this.supportedExtensions = artefactScanInfo.modelscanSupportedExtensions ?? this.supportedExtensions
    this.maxSize = artefactScanInfo.maxFileSizeBytes ?? this.maxSize
  }

  protected async _scan(file: FileInterfaceDoc): Promise<ArtefactScanResult> {
    const scannerInfo = this.info()

    if (file.size > this.maxSize) {
      return this.skipContentTooLarge(file, file.size)
    }

    const lowerFileName = file.name.toLowerCase()
    // Do not use `path.extname` as it will not handle compound extensions e.g. `.tar.gz`
    const isSupported = this.supportedExtensions.some((ext) => lowerFileName.endsWith(ext.toLowerCase()))
    if (this.supportedExtensions.length > 0 && !isSupported) {
      return this.skipUnsupportedFileType()
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

      if (scanResults.summary.skipped.total_skipped > 0) {
        return this.skipUnsupportedFileType()
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
      // Content too large
      if (isBailoError(error) && error.code === 413) {
        return this.skipContentTooLarge(file, file.size)
      }
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

  protected skipUnsupportedFileType(): ArtefactScanResult {
    return this.scanSkip([UNSUPPORTED_FILE_TYPE_MESSAGE])
  }
}
