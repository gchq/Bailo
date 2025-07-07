import { FileInterface } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector, FileScanningConnectorInfo } from './Base.js'

export class FileScanningWrapper extends BaseFileScanningConnector {
  toolName = this.constructor.name
  version = undefined
  scanners: Set<BaseFileScanningConnector> = new Set<BaseFileScanningConnector>()

  constructor(scanners: Set<BaseFileScanningConnector>) {
    super()
    this.scanners = scanners
  }

  async init() {
    for (const scanner of this.scanners) {
      log.info(`Initialising scanner...`, { toolName: scanner.toolName })
      let attempt = 0
      while (attempt <= config.connectors.fileScanners.maxInitRetries) {
        ++attempt
        try {
          await new Promise<void>((resolve, reject) => {
            setTimeout(async () => {
              try {
                await scanner.init()
              } catch (error) {
                return reject(error)
              }
              log.info(`Scanner initialised`, { toolName: scanner.toolName })
              return resolve()
            }, config.connectors.fileScanners.initRetryDelay)
          })
          break
        } catch (error) {
          log.warn(`Could not initialise scanner, retrying.`, { attempt: attempt, toolName: scanner.toolName, error })
        }
      }
      if (attempt > config.connectors.fileScanners.maxInitRetries) {
        throw ConfigurationError(
          `Could not initialise scanner after max attempts, make sure that it is setup and configured correctly.`,
          { failedAttempts: attempt, toolName: this.toolName },
        )
      }
    }
  }

  info(): FileScanningConnectorInfo & { scannerNames: string[] } {
    const scannersInfo = Array.from(this.scanners).map((scanner) => {
      return scanner.info()
    })

    const scannerNames = scannersInfo.map((scannerInfo) => scannerInfo.toolName)
    return { toolName: this.constructor.name, scannerNames: scannerNames }
  }

  async scan(file: FileInterface) {
    const results = await Promise.all(
      Array.from(this.scanners).map((scanner) => {
        log.info(
          { modelId: file.modelId, fileId: file._id.toString(), name: file.name, toolName: scanner.toolName },
          'Scan started.',
        )
        return scanner.scan(file)
      }),
    )

    return results.flat()
  }
}
