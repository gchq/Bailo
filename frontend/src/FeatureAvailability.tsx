import Alert from '@mui/material/Alert'
import { useContext } from 'react'
import ArtefactScanningInfoContext from 'src/contexts/artefactScanningInfoContext'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { ArtefactKind, ScanInfoInterface, UiConfig } from 'types/types'

export type FeatureKey =
  'inference' | 'modelMirrorImport' | 'untrustedModel' | 'llmImport' | 'fileScanning' | 'imageScanning'

type FeatureDetails = {
  name: string
  isEnabled: (uiConfig: UiConfig, scanners: ScanInfoInterface[]) => boolean
}

const features: Record<FeatureKey, FeatureDetails> = {
  inference: { name: 'Inferencing', isEnabled: (uiConfig) => !!uiConfig.inference?.enabled },
  modelMirrorImport: { name: 'Model mirroring', isEnabled: (uiConfig) => !!uiConfig.modelMirror?.import?.enabled },
  untrustedModel: { name: 'Untrusted models', isEnabled: (uiConfig) => !!uiConfig.untrustedModel?.enabled },
  llmImport: { name: 'LLM import', isEnabled: (uiConfig) => !!uiConfig.llmImport?.enabled },
  fileScanning: {
    name: 'File scanning',
    isEnabled: (_uiConfig, scanners) => scanners.some((scanner) => scanner.artefactKind === ArtefactKind.FILE),
  },
  imageScanning: {
    name: 'Image scanning',
    isEnabled: (_uiConfig, scanners) => scanners.some((scanner) => scanner.artefactKind === ArtefactKind.IMAGE),
  },
}

type FeatureAvailabilityProps = {
  feature: FeatureKey
}

export default function FeatureAvailability({ feature }: FeatureAvailabilityProps) {
  const uiConfig = useContext(UiConfigContext)
  const scanners = useContext(ArtefactScanningInfoContext)
  const { name, isEnabled } = features[feature]

  return isEnabled(uiConfig, scanners) ? (
    <Alert sx={{ my: '20px' }} severity='success'>
      {name} is enabled on this instance of Bailo.
    </Alert>
  ) : (
    <Alert sx={{ my: '20px' }} severity='warning'>
      {name} is disabled on this instance of Bailo.
    </Alert>
  )
}
