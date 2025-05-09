import { FileInterface } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector, FileScanningConnectorInfo, FileScanResult } from './Base.js'

export class FileScanningWrapper extends BaseFileScanningConnector {
  toolName = this.constructor.name
  version = undefined
  scanners: BaseFileScanningConnector[] = []

  constructor(scanners: BaseFileScanningConnector[]) {
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
          log.warn(`Could not initialise scanner, retrying.`, { attempt: attempt, toolName: this.toolName, error })
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
    const scannersInfo = this.scanners.map((scanner) => {
      return scanner.info()
    })

    const scannerNames = scannersInfo.map((scannerInfo) => scannerInfo.toolName)
    return { toolName: this.constructor.name, scannerNames: scannerNames }
  }

  async scan(file: FileInterface) {
    const results: FileScanResult[] = []
    for (const scanner of this.scanners) {
      log.info(
        { modelId: file.modelId, fileId: file._id.toString(), name: file.name, toolName: this.toolName },
        'Scan started.',
      )
      const scannerResults = await scanner.scan(file)
      results.push(...scannerResults)
    }

    return results
  }
}
