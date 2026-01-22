import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseQueueArtefactScanningConnector } from './Base.js'
import { ClamAvFileScanningConnector } from './clamAv.js'
import { ModelScanFileScanningConnector } from './modelScan.js'
import { ArtefactScanningWrapper } from './wrapper.js'

export const ArtefactScanKind = {
  ClamAv: 'clamAV',
  ModelScan: 'modelScan',
} as const
export type ArtefactScanKindKeys = (typeof ArtefactScanKind)[keyof typeof ArtefactScanKind]

const artefactScanConnectors: Set<BaseQueueArtefactScanningConnector> = new Set<BaseQueueArtefactScanningConnector>()
let scannerWrapper: undefined | ArtefactScanningWrapper = undefined

async function addArtefactScanners(cache = true): Promise<ArtefactScanningWrapper> {
  if (scannerWrapper && cache) {
    return scannerWrapper
  }
  for (const artefactScanner of config.connectors.artefactScanners.kinds) {
    switch (artefactScanner) {
      case ArtefactScanKind.ClamAv:
        try {
          const scanner = new ClamAvFileScanningConnector()
          artefactScanConnectors.add(scanner)
        } catch (error) {
          throw ConfigurationError('Could not configure or initialise Clam AV', { error })
        }
        break
      case ArtefactScanKind.ModelScan:
        try {
          const scanner = new ModelScanFileScanningConnector()
          artefactScanConnectors.add(scanner)
        } catch (error) {
          throw ConfigurationError('Could not configure or initialise ModelScan', { error })
        }
        break
      default:
        throw ConfigurationError(`'${artefactScanner}' is not a valid file scanning kind.`, {
          validKinds: Object.values(ArtefactScanKind),
        })
    }
  }

  scannerWrapper = new ArtefactScanningWrapper(artefactScanConnectors)
  await scannerWrapper.initialiseScanners()
  return scannerWrapper
}

export default await addArtefactScanners()
