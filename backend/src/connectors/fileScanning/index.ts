import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { ArtefactScanFileScanningConnector } from './artefactScan.js'
import { BaseFileScanningConnector } from './Base.js'
import { ClamAvFileScanningConnector } from './clamAv.js'
import { FileScanningWrapper } from './wrapper.js'

export const FileScanKind = {
  ClamAv: 'clamAV',
  ArtefactScan: 'artefactScan',
} as const
export type FileScanKindKeys = (typeof FileScanKind)[keyof typeof FileScanKind]

const fileScanConnectors: Set<BaseFileScanningConnector> = new Set<BaseFileScanningConnector>()
let scannerWrapper: undefined | FileScanningWrapper = undefined
export async function runFileScanners(cache = true) {
  if (scannerWrapper && cache) {
    return scannerWrapper
  }
  for (const fileScanner of config.connectors.fileScanners.kinds) {
    switch (fileScanner) {
      case FileScanKind.ClamAv:
        try {
          const scanner = new ClamAvFileScanningConnector()
          fileScanConnectors.add(scanner)
        } catch (error) {
          throw ConfigurationError('Could not configure or initialise Clam AV', { error })
        }
        break
      case FileScanKind.ArtefactScan:
        try {
          const scanner = new ArtefactScanFileScanningConnector()
          fileScanConnectors.add(scanner)
        } catch (error) {
          throw ConfigurationError('Could not configure or initialise ArtefactScan', { error })
        }
        break
      default:
        throw ConfigurationError(`'${fileScanner}' is not a valid file scanning kind.`, {
          validKinds: Object.values(FileScanKind),
        })
    }
  }

  scannerWrapper = new FileScanningWrapper(fileScanConnectors)
  await scannerWrapper.init()
  return scannerWrapper
}

export default await runFileScanners()
