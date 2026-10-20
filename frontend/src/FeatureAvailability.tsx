import Alert from '@mui/material/Alert'
import { useGetStatus } from 'actions/system'
import { useContext } from 'react'
import ArtefactScanningInfoContext from 'src/contexts/artefactScanningInfoContext'
import UiConfigContext from 'src/contexts/uiConfigContext'
import MessageAlert from 'src/MessageAlert'
import { ArtefactKind, FederationState, ScanInfoInterface, UiConfig } from 'types/types'

type ConfigFeatureKey =
  'inference' | 'modelMirrorImport' | 'untrustedModel' | 'llmImport' | 'fileScanning' | 'imageScanning'

export type FeatureKey = ConfigFeatureKey | 'federation'

type FeatureDetails = {
  name: string
  isEnabled: (uiConfig: UiConfig, scanners: ScanInfoInterface[]) => boolean
}

const features: Record<ConfigFeatureKey, FeatureDetails> = {
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
  if (feature === 'federation') {
    return <FederationAvailability />
  }

  return <ConfigFeatureAvailability feature={feature} />
}

function ConfigFeatureAvailability({ feature }: { feature: ConfigFeatureKey }) {
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

function FederationAvailability() {
  const { status, isStatusLoading, isStatusError } = useGetStatus()

  if (isStatusError) {
    return <MessageAlert message={isStatusError.info.message} severity='error' />
  }

  if (isStatusLoading) {
    return null
  }

  switch (status?.federation?.state) {
    case FederationState.ENABLED:
      return (
        <Alert sx={{ my: '20px' }} severity='success'>
          Federation is enabled on this instance of Bailo.
        </Alert>
      )
    case FederationState.READ_ONLY:
      return (
        <Alert sx={{ my: '20px' }} severity='info'>
          Federation is read-only on this instance of Bailo.
        </Alert>
      )
    default:
      return (
        <Alert sx={{ my: '20px' }} severity='warning'>
          Federation is disabled on this instance of Bailo.
        </Alert>
      )
  }
}
