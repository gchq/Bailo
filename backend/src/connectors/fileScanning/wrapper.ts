import { FileInterface } from '../../models/File.js'
import log from '../../services/log.js'
import { BaseFileScanningConnector, FileScanResult } from './Base.js'

export class FileScanningWrapper extends BaseFileScanningConnector {
  scanners: BaseFileScanningConnector[] = []

  constructor(scanners: BaseFileScanningConnector[]) {
    super()
    this.scanners = scanners
  }

  info() {
    const scannerNames: string[] = []
    for (const scanner of this.scanners) {
      scannerNames.push(...scanner.info())
    }
    return scannerNames
  }

  async scan(file: FileInterface) {
    const results: FileScanResult[] = []
    for (const scanner of this.scanners) {
      log.info(
        { modelId: file.modelId, fileId: file._id, name: file.name, toolName: scanner.info().pop() },
        'Scan started.',
      )
      const scannerResults = await scanner.scan(file)
      results.push(...scannerResults)
    }

    return results
  }
}
