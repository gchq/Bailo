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
