import { FileInterface } from '../../models/File.js'
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
    await Promise.all(
      Array.from(this.scanners).map(async (scanner) => {
        log.info({ toolName: scanner.toolName }, `Scanner initialising...`)
        let attempt = 0
        while (attempt <= config.connectors.artefactScanners.maxInitRetries) {
          ++attempt
          try {
            await new Promise<void>((resolve, reject) => {
              setTimeout(async () => {
                try {
                  await scanner.init()
                } catch (error) {
                  return reject(error)
                }
                log.info({ toolName: scanner.toolName }, `Scanner initialised`)
                return resolve()
              }, config.connectors.artefactScanners.initRetryDelay)
            })
            break
          } catch (error) {
            log.warn({ attempt: attempt, toolName: scanner.toolName, error }, `Could not initialise scanner, retrying.`)
          }
        }
        if (attempt > config.connectors.artefactScanners.maxInitRetries) {
          throw ConfigurationError(
            `Could not initialise scanner after max attempts, make sure that it is setup and configured correctly.`,
            { failedAttempts: attempt, toolName: scanner.toolName },
          )
        }
      }),
    )
  }

  scannersInfo(): ArtefactScanningConnectorInfo[] {
    return Array.from(this.scanners).map((scanner) => {
      return scanner.info()
    })
  }

  async startScans({
    file,
    layerRef,
  }: { file: FileInterface; layerRef?: never } | { file?: never; layerRef: LayerRefInterface }) {
    const results = await Promise.all(
      Array.from(this.scanners)
        .map((scanner) => {
          if (file && scanner.artefactType === 'file') {
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
          } else if (layerRef && scanner.artefactType === 'image') {
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
