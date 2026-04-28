import PQueue from 'p-queue'

import { getCachedArtefactScanInfo, scanImageBlobStream } from '../../clients/artefactScan.js'
import { getRegistryLayerStream, headLayer } from '../../clients/registry.js'
import {
  ArtefactKind,
  ArtefactKindKeys,
  ArtefactScanSummary,
  SeverityLevel,
  SeverityLevelKeys,
} from '../../models/Scan.js'
import { issueAccessToken } from '../../routes/v1/registryAuth.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ContentTooLarge } from '../../utils/error.js'
import { ArtefactScanResult, ArtefactScanState, BaseArtefactScanningConnector, LayerRefInterface } from './Base.js'

export class TrivyImageScanningConnector extends BaseArtefactScanningConnector {
  readonly queue: PQueue = new PQueue({ concurrency: config.artefactScanning.artefactscan.concurrency })
  readonly artefactType: ArtefactKindKeys = ArtefactKind.IMAGE
  readonly toolName: string = 'Trivy'
  protected maxImageSizeBytes: number = Infinity

  async init(): Promise<void> {
    const artefactScanInfo = await getCachedArtefactScanInfo()
    this.version = artefactScanInfo.trivyVersion
    this.maxImageSizeBytes = artefactScanInfo.maxFileSizeBytes ?? this.maxImageSizeBytes
  }

  protected async _scan(layer: LayerRefInterface): Promise<ArtefactScanResult> {
    const scannerInfo = this.info()

    try {
      // User does not pull the layer so attribute to the scanner
      const repositoryToken = await issueAccessToken({ dn: this.toolName }, [
        { type: 'repository', name: `${layer.repository}/${layer.name}`, actions: ['pull'] },
      ])

      if (this.maxImageSizeBytes != Infinity) {
        const layerHeadDetails = await headLayer(
          repositoryToken,
          { repository: layer.repository, name: layer.name },
          layer.layerDigest,
        )
        const layerSize = parseInt(layerHeadDetails.headers['content-length'] || '') || Infinity

        if (layerSize != Infinity && layerSize > this.maxImageSizeBytes) {
          throw ContentTooLarge('Unrecognised response returned by the ArtefactScan service.', {
            status: 413,
            statusText: 'Request Entity Too Large',
            endpoint: this.artefactType,
            layer,
            responseBody: {
              detail: `Maximum content size limit (${this.maxImageSizeBytes}) exceeded (${layerSize} bytes read)`,
            },
          })
        }
      }

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
        error,
        layer,
      })
    }
  }
}
