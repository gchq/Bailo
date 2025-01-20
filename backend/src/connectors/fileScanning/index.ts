import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseFileScanningConnector } from './Base.js'
import { ClamAvFileScanningConnector } from './clamAv.js'
import { ModelScanFileScanningConnector } from './modelScan.js'
import { FileScanningWrapper } from './wrapper.js'

export const FileScanKind = {
  ClamAv: 'clamAV',
  ModelScan: 'modelScan',
} as const
export type FileScanKindKeys = (typeof FileScanKind)[keyof typeof FileScanKind]

const fileScanConnectors: BaseFileScanningConnector[] = []
let scannerWrapper: undefined | BaseFileScanningConnector = undefined
export function runFileScanners(cache = true) {
  if (scannerWrapper && cache) {
    return scannerWrapper
  }
  config.connectors.fileScanners.kinds.forEach(async (fileScanner) => {
    switch (fileScanner) {
      case FileScanKind.ClamAv:
        try {
          const scanner = new ClamAvFileScanningConnector()
          await scanner.init()
          fileScanConnectors.push(scanner)
        } catch (error) {
          throw ConfigurationError('Could not configure or initialise Clam AV')
        }
        break
      case FileScanKind.ModelScan:
        try {
          const scanner = new ModelScanFileScanningConnector()
          await scanner.init()
          fileScanConnectors.push(scanner)
        } catch (error) {
          throw ConfigurationError('Could not configure or initialise ModelScan')
        }
        break
      default:
        throw ConfigurationError(`'${fileScanner}' is not a valid file scanning kind.`, {
          validKinds: Object.values(FileScanKind),
        })
    }
  })
  scannerWrapper = new FileScanningWrapper(fileScanConnectors)
  return scannerWrapper
}

export default runFileScanners()
