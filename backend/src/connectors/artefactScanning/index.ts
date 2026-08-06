import config from '../../utils/config.js'
import { ConfigurationError } from '../../utils/error.js'
import { BaseArtefactScanningConnector } from './Base.js'
import { ClamAvFileScanningConnector } from './clamAv.js'
import { ModelScanFileScanningConnector } from './modelScan.js'
import { TrivyImageScanningConnector } from './trivy.js'
import { ArtefactScanningWrapper } from './wrapper.js'

export const ArtefactScanKind = {
  ClamAv: 'clamAV',
  ModelScan: 'modelScan',
  Trivy: 'trivy',
} as const
export type ArtefactScanKindKeys = (typeof ArtefactScanKind)[keyof typeof ArtefactScanKind]

const artefactScanConnectors: Set<BaseArtefactScanningConnector> = new Set<BaseArtefactScanningConnector>()
let scannerWrapper: undefined | ArtefactScanningWrapper = undefined

const ArtefactScanKindConstructors: Record<ArtefactScanKindKeys, new () => BaseArtefactScanningConnector> = {
  [ArtefactScanKind.ClamAv]: ClamAvFileScanningConnector,
  [ArtefactScanKind.ModelScan]: ModelScanFileScanningConnector,
  [ArtefactScanKind.Trivy]: TrivyImageScanningConnector,
}

async function addArtefactScanners(cache = true): Promise<ArtefactScanningWrapper> {
  if (scannerWrapper && cache) {
    return scannerWrapper
  }
  artefactScanConnectors.clear()
  for (const scannerKind of config.connectors.artefactScanners.kinds) {
    const Scanner = ArtefactScanKindConstructors[scannerKind]

    if (!Scanner) {
      throw ConfigurationError(`'${scannerKind}' is not a valid scanning kind.`, {
        validKinds: Object.keys(ArtefactScanKindConstructors),
      })
    }

    try {
      artefactScanConnectors.add(new Scanner())
    } catch (error) {
      throw ConfigurationError(`Could not configure or initialise scanner ${scannerKind}`, { error })
    }
  }

  scannerWrapper = new ArtefactScanningWrapper(artefactScanConnectors)
  await scannerWrapper.initialiseScanners()
  return scannerWrapper
}

export default await addArtefactScanners()
