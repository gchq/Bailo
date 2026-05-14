import { FileInterface } from '../../models/File.js'
import { ArtefactKind, ArtefactKindKeys } from '../../models/Scan.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { ArtefactScanningConnectorInfo, BaseArtefactScanningConnector, LayerRefInterface } from './Base.js'

export class ArtefactScanningWrapper {
  scanners: Set<BaseArtefactScanningConnector> = new Set<BaseArtefactScanningConnector>()
  constructor(scanners: Set<BaseArtefactScanningConnector>) {
    this.scanners = scanners
  }

  async initialiseScanners() {
    await Promise.all(Array.from(this.scanners).map((scanner) => this.initialiseScanner(scanner)))
  }

  private async initialiseScanner(scanner: BaseArtefactScanningConnector) {
    log.info({ toolName: scanner.toolName }, 'Scanner initialising...')

    for (let attempt = 1; attempt <= config.connectors.artefactScanners.maxInitRetries; attempt++) {
      try {
        await scanner.init()

        log.info({ toolName: scanner.toolName }, 'Scanner initialised')
        return
      } catch (error) {
        if (attempt === config.connectors.artefactScanners.maxInitRetries) {
          throw ConfigurationError(
            'Could not initialise scanner after max attempts, make sure that it is setup and configured correctly.',
            {
              toolName: scanner.toolName,
              failedAttempts: attempt,
              error,
            },
          )
        } else {
          log.warn({ attempt, toolName: scanner.toolName, error }, 'Could not initialise scanner, retrying.')
        }

        await new Promise((r) => setTimeout(r, config.connectors.artefactScanners.initRetryDelay))
      }
    }
  }

  scannersInfo(): ArtefactScanningConnectorInfo[] {
    return Array.from(this.scanners).map((scanner) => {
      return scanner.info()
    })
  }

  hasScannerForArtefactKind(kind: ArtefactKindKeys) {
    const info = this.scannersInfo()
    return info.some((scannerInfo) => scannerInfo.artefactKind === kind)
  }

  async startScans({
    file,
    layerRef,
  }: { file: FileInterface; layerRef?: never } | { file?: never; layerRef: LayerRefInterface }) {
    const results = await Promise.all(
      Array.from(this.scanners)
        .map((scanner) => {
          if (file && scanner.artefactType === ArtefactKind.FILE) {
            log.info(
              {
                modelId: file.modelId,
                fileId: file._id.toString(),
                name: file.name,
                toolName: scanner.toolName,
              },
              'Requesting scan to be queued',
            )
            return scanner.scan(file)
          } else if (layerRef && scanner.artefactType === ArtefactKind.IMAGE) {
            log.info(
              {
                ...layerRef,
                toolName: scanner.toolName,
              },
              'Requesting scan to be queued',
            )
            return scanner.scan(layerRef)
          }
        })
        .filter((scanner) => scanner !== undefined),
    )
    return results.flat()
  }
}
