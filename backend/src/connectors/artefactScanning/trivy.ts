import PQueue from 'p-queue'

import { getCachedArtefactScanInfo, scanImageBlobStream } from '../../clients/artefactScan.js'
import { getRegistryLayerStream } from '../../clients/registry.js'
import {
  ArtefactKind,
  ArtefactKindKeys,
  ArtefactScanSummary,
  SeverityLevel,
  SeverityLevelKeys,
} from '../../models/Scan.js'
import { getAccessToken } from '../../routes/v1/registryAuth.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ArtefactScanResult, ArtefactScanState, BaseArtefactScanningConnector, LayerRefInterface } from './Base.js'

export class TrivyImageScanningConnector extends BaseArtefactScanningConnector {
  readonly queue: PQueue = new PQueue({ concurrency: config.artefactScanning.artefactscan.concurrency })
  artefactType: ArtefactKindKeys = ArtefactKind.IMAGE
  toolName: string = 'Trivy'

  async init() {
    if (!this.version) {
      const artefactScanInfo = await getCachedArtefactScanInfo()
      this.version = artefactScanInfo.trivyVersion
    }
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
        const scanResults = await scanImageBlobStream(stream, layerDigestName)

        // Set compares object identity so instead use a Map where we control the key for string equality
        const summaries = new Map<string, ArtefactScanSummary>()
        for (const result of scanResults.Results ?? []) {
          if (!result.Vulnerabilities) {
            continue
          }

          for (const vulnerability of result.Vulnerabilities) {
            const key = vulnerability.VulnerabilityID
            const title = vulnerability.Title ?? ''
            const severity = vulnerability.Severity ?? SeverityLevel.UNKNOWN

            if (!summaries.get(key)) {
              summaries.set(key, {
                severity: severity.toLowerCase() as SeverityLevelKeys,
                vulnerabilityDescription: `${key}: ${title}`,
              })
            }
          }
        }

        const summary = Array.from(summaries.values())
        log.debug({ layer, result: { summary }, ...scannerInfo }, 'Scan complete.')
        return {
          ...scannerInfo,
          state: ArtefactScanState.Complete,
          summary,
          additionalInfo: scanResults,
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
