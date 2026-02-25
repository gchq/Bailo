import PQueue from 'p-queue'

import { getArtefactScanInfo, scanFileStream, scanImageBlobStream } from '../../clients/artefactScan.js'
import { getRegistryLayerStream } from '../../clients/registry.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ArtefactKind, ArtefactKindKeys, ArtefactScanSummary, SeverityLevelKeys } from '../../models/Scan.js'
import { getAccessToken } from '../../routes/v1/registryAuth.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ArtefactBaseScanningConnector, ArtefactScanResult, ArtefactScanState, LayerRefInterface } from './Base.js'

abstract class ArtefactScanBaseScanningConnector extends ArtefactBaseScanningConnector {
  queue: PQueue = new PQueue({ concurrency: config.artefactScanning.artefactscan.concurrency })
  version: string | undefined = undefined

  constructor() {
    super()
  }
}

export class ModelScanFileScanningConnector extends ArtefactScanBaseScanningConnector {
  artefactType: ArtefactKindKeys = ArtefactKind.FILE
  toolName: string = 'ModelScan'

  async init() {
    const artefactScanInfo = await getArtefactScanInfo()
    this.version = artefactScanInfo.modelscanVersion
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

export class TrivyImageScanningConnector extends ArtefactScanBaseScanningConnector {
  artefactType: ArtefactKindKeys = ArtefactKind.IMAGE
  toolName: string = 'Trivy'

  async init() {
    const artefactScanInfo = await getArtefactScanInfo()
    this.version = artefactScanInfo.trivyVersion
    return this
  }

  async _scan(layer: LayerRefInterface): Promise<ArtefactScanResult> {
    await this.init()
    const scannerInfo = this.info()
    if (!scannerInfo.scannerVersion) {
      return await this.scanError('Could not use ArtefactScan as it is not running.', { ...scannerInfo })
    }

    try {
      // User does not pull the layer so attribute to the scanner
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
        const results = await scanImageBlobStream(stream, layerDigestName)

        const summaries: Set<ArtefactScanSummary> = new Set<ArtefactScanSummary>()
        for (const result of results.Results ?? []) {
          if (!result.Vulnerabilities) {
            continue
          }
          for (const vulnerability of result.Vulnerabilities) {
            summaries.add({
              severity: vulnerability.Severity.toLowerCase() as SeverityLevelKeys,
              vulnerabilityDescription: `${vulnerability.VulnerabilityID} ${vulnerability.Title}`,
            })
          }
        }

        const summary = Array.from(summaries)
        log.debug({ layer, result: { summary }, ...scannerInfo }, 'Scan complete.')
        return {
          ...scannerInfo,
          state: ArtefactScanState.Complete,
          summary,
          additionalInfo: results,
          lastRunAt: new Date(),
        }
      } catch (err) {
        abort()
        throw err
      }
    } catch (error) {
      return this.scanError(`This image layer could not be scanned due to an error caused by ${this.toolName}`, {
        error: Error.isError(error) ? { name: error.name, stack: error.stack } : error,
        layer,
      })
    }
  }
}
