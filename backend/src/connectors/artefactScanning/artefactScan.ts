import PQueue from 'p-queue'

import { getArtefactScanInfo, scanFileStream, scanImageBlobStream } from '../../clients/artefactScan.js'
import { getRegistryLayerStream } from '../../clients/registry.js'
import { getObjectStream } from '../../clients/s3.js'
import { FileInterfaceDoc } from '../../models/File.js'
import { ImageRefInterface } from '../../models/Release.js'
import { ModelScanSummary, SeverityLevelKeys } from '../../models/Scan.js'
import { getAccessToken } from '../../routes/v1/registryAuth.js'
import { getImageLayers } from '../../services/images/getImageLayers.js'
import log from '../../services/log.js'
import { ArtefactType, ArtefactTypeKeys } from '../../types/types.js'
import config from '../../utils/config.js'
import { ArtefactBaseScanningConnector, ArtefactScanResult, ArtefactScanState } from './Base.js'

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

  async _scan(image: ImageRefInterface): Promise<ArtefactScanResult> {
    await this.init()
    const scannerInfo = this.info()
    if (!scannerInfo.scannerVersion) {
      return await this.scanError('Could not use ArtefactScan as it is not running.', { ...scannerInfo })
    }

    try {
      const registryToken = await getAccessToken(
        { dn: this.constructor.name }, // service identity
        [{ type: 'repository', name: `${image.repository}/${image.name}`, actions: ['pull'] }],
      )

      const layers = await getImageLayers(registryToken, image)

      const summaries: ModelScanSummary[] = []

      for (const layer of layers) {
        const { stream, abort } = await getRegistryLayerStream(
          registryToken,
          { repository: image.repository, name: image.name },
          layer.digest,
        )

        try {
          const result = await scanImageBlobStream(stream, layer.digest)
          log.info({ result, layer })

          // map trivy -> model scan summary
          // for (const vuln of result.vulnerabilities ?? []) {
          //   summaries.push({
          //     severity: vuln.severity.toLowerCase() as SeverityLevelKeys,
          //     vulnerabilityDescription: vuln.title,
          //   })
          // }
        } catch (err) {
          abort()
          throw err
        }
      }

      log.info(summaries)

      return {
        ...scannerInfo,
        state: ArtefactScanState.Complete,
        summary: [], // TODO
        lastRunAt: new Date(),
      }
    } catch (error) {
      return this.scanError(`This file could not be scanned due to an error caused by ${this.toolName}`, {
        error: Error.isError(error) ? { name: error.name, stack: error.stack } : error,
        file: image,
      })
    }
  }
}
