import { FileInterface } from '../../models/File.js'
import log from '../../services/log.js'
import { BaseFileScanningConnector, FileScanningConnectorInfo, FileScanResult } from './Base.js'

export class FileScanningWrapper extends BaseFileScanningConnector {
  toolName = this.constructor.name
  scanners: BaseFileScanningConnector[] = []

  constructor(scanners: BaseFileScanningConnector[]) {
    super()
    this.scanners = scanners
  }

  async info(): Promise<FileScanningConnectorInfo & { scannerNames: string[] }> {
    const scannersInfo = await Promise.all(
      this.scanners.map(async (scanner) => {
        return await scanner.info()
      }),
    )
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
