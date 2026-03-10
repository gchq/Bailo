import { getCachedArtefactScanInfo, scanFileStream } from '../../clients/artefactScan.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ArtefactKind, ArtefactKindKeys, ArtefactScanSummary, SeverityLevelKeys } from '../../models/Scan.js'
import log from '../../services/log.js'
import { ArtefactScanBaseScanningConnector } from './artefactScanBase.js'
import { ArtefactScanResult, ArtefactScanState } from './Base.js'

export class ModelScanFileScanningConnector extends ArtefactScanBaseScanningConnector {
  artefactType: ArtefactKindKeys = ArtefactKind.FILE
  toolName: string = 'ModelScan'

  async init() {
    if (!this.version) {
      const artefactScanInfo = await getCachedArtefactScanInfo()
      this.version = artefactScanInfo.modelscanVersion
    }
    return this
  }

  async _scan(file: FileInterfaceDoc): Promise<ArtefactScanResult> {
    await this.init()
    const scannerInfo = this.info()
    if (!scannerInfo.scannerVersion) {
      return await this.scanError('Could not use ArtefactScan as it is not running.', { ...scannerInfo })
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
