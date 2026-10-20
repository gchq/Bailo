import Alert from '@mui/material/Alert'
import { useContext } from 'react'
import UiConfigContext from 'src/contexts/uiConfigContext'
import { UiConfig } from 'types/types'

export type FeatureKey = 'inference' | 'modelMirrorImport' | 'untrustedModel' | 'llmImport'

const features: Record<FeatureKey, { name: string; isEnabled: (uiConfig: UiConfig) => boolean }> = {
  inference: { name: 'Inferencing', isEnabled: (uiConfig) => !!uiConfig.inference?.enabled },
  modelMirrorImport: { name: 'Model mirroring', isEnabled: (uiConfig) => !!uiConfig.modelMirror?.import?.enabled },
  untrustedModel: { name: 'Untrusted models', isEnabled: (uiConfig) => !!uiConfig.untrustedModel?.enabled },
  llmImport: { name: 'LLM import', isEnabled: (uiConfig) => !!uiConfig.llmImport?.enabled },
}

type FeatureAvailabilityProps = {
  feature: FeatureKey
}

export default function FeatureAvailability({ feature }: FeatureAvailabilityProps) {
  const uiConfig = useContext(UiConfigContext)
  const { name, isEnabled } = features[feature]

  return isEnabled(uiConfig) ? (
    <Alert sx={{ my: '20px' }} severity='success'>
      {name} is enabled on this instance of Bailo.
    </Alert>
  ) : (
    <Alert sx={{ my: '20px' }} severity='warning'>
      {name} is disabled on this instance of Bailo.
    </Alert>
  )
}
