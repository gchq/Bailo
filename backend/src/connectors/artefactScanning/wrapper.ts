import { FileInterface } from '../../models/File.js'
import { ImageRefInterface } from '../../models/Release.js'
import log from '../../services/log.js'
import { ArtefactType, ArtefactTypeKeys } from '../../types/types.js'
import config from '../../utils/config.js'
import { ConfigurationError, InternalError } from '../../utils/error.js'
import { ArtefactBaseScanningConnector, ArtefactInterface, ArtefactScanningConnectorInfo } from './Base.js'

export class ArtefactScanningWrapper {
  scanners: Set<ArtefactBaseScanningConnector> = new Set<ArtefactBaseScanningConnector>()
  constructor(scanners: Set<ArtefactBaseScanningConnector>) {
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

  scannersInfo(): ArtefactScanningConnectorInfo & { scannerNames: string[] } {
    const scannersInfo = Array.from(this.scanners).map((scanner) => {
      return scanner.info()
    })

    const scannerNames = scannersInfo.map((scannerInfo) => scannerInfo.toolName)
    return { toolName: this.constructor.name, scannerNames: scannerNames }
  }

  isMatchingInterface(
    artefact: ArtefactInterface,
    scanner: ArtefactBaseScanningConnector,
  ): { matching: boolean; artefactType: ArtefactTypeKeys } {
    let artefactType: ArtefactTypeKeys | undefined = undefined
    switch (true) {
      case !!(artefact as ImageRefInterface).tag:
        artefactType = ArtefactType.IMAGE
        break
      case !!(artefact as FileInterface)._id:
        artefactType = ArtefactType.FILE
    }
    if (artefactType !== undefined) {
      return { matching: artefactType === scanner.artefactType, artefactType }
    } else {
      throw TypeError(`Attempting to scan incorrect artefact type, make sure you are passing in a valid artefact`)
    }
  }

  async startScans(artefact: ArtefactInterface) {
    const results = await Promise.all(
      Array.from(this.scanners)
        .map((scanner) => {
          const artefactMatch = this.isMatchingInterface(artefact, scanner)
          if (artefactMatch.matching) {
            switch (artefactMatch.artefactType) {
              case ArtefactType.FILE:
                log.info(
                  {
                    modelId: (artefact as FileInterface).modelId,
                    fileId: (artefact as FileInterface)._id.toString(),
                    name: (artefact as FileInterface).name,
                    toolName: scanner.toolName,
                  },
                  'Scan started.',
                )
                break
              case ArtefactType.IMAGE:
                log.info(
                  {
                    repository: (artefact as ImageRefInterface).repository,
                    name: (artefact as ImageRefInterface).name,
                    tag: (artefact as ImageRefInterface).tag,
                    toolName: scanner.toolName,
                  },
                  'Scan started.',
                )
                break
              default:
                throw InternalError('Incompatible artefact type')
            }

            return scanner.scan(artefact)
          }
        })
        .filter((scanner) => scanner !== undefined),
    )
    return results.flat()
  }
}
