import { FileInterface } from '../../models/File.js'
import { ArtefactKind, ArtefactKindKeys } from '../../models/Scan.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError, InternalError } from '../../utils/error.js'
import {
  ArtefactInterface,
  ArtefactScanningConnectorInfo,
  BaseArtefactScanningConnector,
  LayerRefInterface,
} from './Base.js'

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

  isMatchingInterface(
    artefact: ArtefactInterface,
    scanner: BaseArtefactScanningConnector,
  ): { matching: boolean; artefactType: ArtefactKindKeys } {
    let artefactType: ArtefactKindKeys | undefined = undefined
    switch (true) {
      case typeof artefact === 'object' && artefact !== null && ('tag' in artefact || 'digest' in artefact):
        artefactType = ArtefactKind.IMAGE
        break
      case !!(artefact as FileInterface)._id:
        artefactType = ArtefactKind.FILE
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
              case ArtefactKind.FILE:
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
              case ArtefactKind.IMAGE:
                log.info(
                  {
                    ...(artefact as LayerRefInterface),
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
