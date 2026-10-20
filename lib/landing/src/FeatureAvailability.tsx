import Alert from '@mui/material/Alert'
import Link from 'src/Link'

// Static counterpart of frontend/src/FeatureAvailability.tsx - there is no backend to query for the UI config or scanners here.
type FeatureKey = 'inference' | 'modelMirrorImport' | 'untrustedModel' | 'llmImport' | 'fileScanning' | 'imageScanning'

const features: Record<FeatureKey, { name: string; configKey: string }> = {
  inference: { name: 'Inferencing', configKey: 'ui.inference.enabled' },
  modelMirrorImport: { name: 'Model mirroring', configKey: 'ui.modelMirror.import.enabled' },
  untrustedModel: { name: 'Untrusted models', configKey: 'ui.untrustedModel.enabled' },
  llmImport: { name: 'LLM import', configKey: 'ui.llmImport.enabled' },
  fileScanning: { name: 'File scanning', configKey: 'connectors.artefactScanners.kinds' },
  imageScanning: { name: 'Image scanning', configKey: 'connectors.artefactScanners.kinds' },
}

type FeatureAvailabilityProps = {
  feature: FeatureKey
}

export default function FeatureAvailability({ feature }: FeatureAvailabilityProps) {
  const { name, configKey } = features[feature]

  return (
    <Alert sx={{ my: '20px' }} severity='info'>
      {name} availability depends on your administrator's{' '}
      <Link href='/docs/administration/getting-started/app-configuration'>configuration</Link> of{' '}
      <code>{configKey}</code>.
    </Alert>
  )
}
