import { FileInterface } from '../../models/File.js'
import log from '../../services/log.js'
import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseQueueFileScanningConnector, FileScanningConnectorInfo } from './Base.js'

export class FileScanningWrapper {
  scanners: Set<BaseQueueFileScanningConnector> = new Set<BaseQueueFileScanningConnector>()
  constructor(scanners: Set<BaseQueueFileScanningConnector>) {
    this.scanners = scanners
  }

  async initialiseScanners() {
    for (const scanner of this.scanners) {
      log.info({ toolName: scanner.toolName }, `Scanner initialising...`)
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
              log.info({ toolName: scanner.toolName }, `Scanner initialised`)
              return resolve()
            }, config.connectors.fileScanners.initRetryDelay)
          })
          break
        } catch (error) {
          log.warn({ attempt: attempt, toolName: scanner.toolName, error }, `Could not initialise scanner, retrying.`)
        }
      }
      if (attempt > config.connectors.fileScanners.maxInitRetries) {
        throw ConfigurationError(
          `Could not initialise scanner after max attempts, make sure that it is setup and configured correctly.`,
          { failedAttempts: attempt, toolName: scanner.toolName },
        )
      }
    }
  }

  scannersInfo(): FileScanningConnectorInfo & { scannerNames: string[] } {
    const scannersInfo = Array.from(this.scanners).map((scanner) => {
      return scanner.info()
    })

    const scannerNames = scannersInfo.map((scannerInfo) => scannerInfo.toolName)
    return { toolName: this.constructor.name, scannerNames: scannerNames }
  }

  async startScans(file: FileInterface) {
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
