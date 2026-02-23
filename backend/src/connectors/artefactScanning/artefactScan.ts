import PQueue from 'p-queue'

import { getArtefactScanInfo, scanFileStream, scanImageBlobStream } from '../../clients/artefactScan.js'
import { getRegistryLayerStream } from '../../clients/registry.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ModelScanSummary, SeverityLevel, SeverityLevelKeys } from '../../models/Scan.js'
import { getAccessToken } from '../../routes/v1/registryAuth.js'
import log from '../../services/log.js'
import { ArtefactType, ArtefactTypeKeys } from '../../types/types.js'
import { mode } from '../../utils/array.js'
import config from '../../utils/config.js'
import { ArtefactBaseScanningConnector, ArtefactScanResult, ArtefactScanState, LayerRefInterface } from './Base.js'

abstract class ArtefactScanBaseScanningConnector extends ArtefactBaseScanningConnector {
  queue: PQueue = new PQueue({ concurrency: config.artefactScanning.artefactscan.concurrency })
  version: string | undefined = undefined

  constructor() {
    super()
  }

  async init() {
    const artefactScanInfo = await getArtefactScanInfo()
    this.version = artefactScanInfo.modelscanVersion
    return this
  }
}

export class ArtefactScanFileScanningConnector extends ArtefactScanBaseScanningConnector {
  artefactType: ArtefactTypeKeys = ArtefactType.FILE
  toolName: string = 'ModelScan'

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

      const summary: ModelScanSummary[] = scanResults.issues.map(
        (issue) =>
          ({
            severity: issue.severity.toLowerCase() as SeverityLevelKeys,
            vulnerabilityDescription: `${issue.description}. (scanner: ${issue.scanner})`,
          }) as ModelScanSummary,
      )

      log.debug({ file, result: { summary }, ...scannerInfo }, 'Scan complete.')
      return {
        ...scannerInfo,
        state: ArtefactScanState.Complete,
        summary,
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

export class ArtefactScanImageScanningConnector extends ArtefactScanBaseScanningConnector {
  artefactType: ArtefactTypeKeys = ArtefactType.IMAGE
  toolName: string = 'Trivy'

  async _scan(layer: LayerRefInterface): Promise<ArtefactScanResult> {
    await this.init()
    const scannerInfo = this.info()
    if (!scannerInfo.scannerVersion) {
      return await this.scanError('Could not use ArtefactScan as it is not running.', { ...scannerInfo })
    }

    const summaries: Set<ModelScanSummary> = new Set<ModelScanSummary>()
    try {
      // TODO: pass this in
      const repositoryToken = await getAccessToken({ dn: this.toolName }, [
        { type: 'repository', name: `${layer.repository}/${layer.name}`, actions: ['pull'] },
      ])

      const { stream, abort } = await getRegistryLayerStream(
        repositoryToken,
        { repository: layer.repository, name: layer.name },
        layer.layerDigest,
      )

      try {
        // strip prefix from blob identifier to get just the name
        const layerDigestName = layer.layerDigest.replace(/^(sha256:)/, '')
        const result = await scanImageBlobStream(stream, layerDigestName)

        // map trivy -> model scan summary
        for (const vuln of result.vulnerabilities ?? []) {
          summaries.add({
            severity: (
              mode(vuln.ratings.map((r) => r.severity)) ?? SeverityLevel.UNKNOWN
            ).toLowerCase() as SeverityLevelKeys,
            vulnerabilityDescription: vuln.id,
          })
        }
      } catch (err) {
        abort()
        throw err
      }

      log.info({ summaries })

      return {
        ...scannerInfo,
        state: ArtefactScanState.Complete,
        summary: Array.from(summaries),
        lastRunAt: new Date(),
      }
    } catch (error) {
      return this.scanError(`This image layer could not be scanned due to an error caused by ${this.toolName}`, {
        error: Error.isError(error) ? { name: error.name, stack: error.stack } : error,
        layer,
      })
    }
  }
}
