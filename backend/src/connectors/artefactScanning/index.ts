import config from '../../utils/config.js'
import { ServiceUnavailable } from '../../utils/error.js'
import { ModelScanFileScanningConnector, TrivyImageScanningConnector } from './artefactScan.js'
import { ArtefactBaseScanningConnector } from './Base.js'
import { ClamAvFileScanningConnector } from './clamAv.js'
import { ArtefactScanningWrapper } from './wrapper.js'

export const ArtefactScanKind = {
  ClamAv: 'clamAV',
  ModelScan: 'modelScan',
  Trivy: 'trivy',
} as const
export type ArtefactScanKindKeys = (typeof ArtefactScanKind)[keyof typeof ArtefactScanKind]

const artefactScanConnectors: Set<ArtefactBaseScanningConnector> = new Set<ArtefactBaseScanningConnector>()
let scannerWrapper: undefined | ArtefactScanningWrapper = undefined

function initScanner<T extends ArtefactBaseScanningConnector>(
  Scanner: new () => T,
  artefactScanner: ArtefactScanKindKeys,
) {
  try {
    const scanner = new Scanner()
    artefactScanConnectors.add(scanner)
  } catch (error) {
    throw ServiceUnavailable(`Could not configure or initialise scanner ${artefactScanner}`, { error })
  }
}

async function addArtefactScanners(cache = true): Promise<ArtefactScanningWrapper> {
  if (scannerWrapper && cache) {
    return scannerWrapper
  }
  artefactScanConnectors.clear()
  for (const artefactScanner of config.connectors.artefactScanners.kinds) {
    switch (artefactScanner) {
      case ArtefactScanKind.ClamAv:
        initScanner(ClamAvFileScanningConnector, artefactScanner)
        break
      case ArtefactScanKind.ModelScan:
        initScanner(ModelScanFileScanningConnector, artefactScanner)
        break
      case ArtefactScanKind.Trivy:
        initScanner(TrivyImageScanningConnector, artefactScanner)
        break
      default:
        throw ServiceUnavailable(`'${artefactScanner}' is not a valid scanning kind.`, {
          validKinds: Object.values(ArtefactScanKind),
        })
    }
  }

  scannerWrapper = new ArtefactScanningWrapper(artefactScanConnectors)
  await scannerWrapper.initialiseScanners()
  return scannerWrapper
}

export default await addArtefactScanners()
