import { useGetModelById, useGetVersionById } from '@/data/model'
import { useGetUsernameFromInternalId } from '@/data/user'
import { Variant } from '@mui/material/styles/createTypography'
import Typography from '@mui/material/Typography'

export function ModelNameFromKey({ modelId, fontVariant }: { modelId: string; fontVariant: Variant }) {
  const { model, isModelError } = useGetModelById(modelId)
  if (isModelError) {
    return <Typography>Error getting model name</Typography>
  }
  return <Typography variant={fontVariant}>{model?.currentMetadata?.highLevelDetails?.name ?? 'Loading...'}</Typography>
}

export function VersionNameFromKey({ versionId, fontVariant }: { versionId: string; fontVariant: Variant }) {
  const { version, isVersionError } = useGetVersionById(versionId)
  if (isVersionError) {
    return <Typography>Error getting version name</Typography>
  }
  return <Typography variant={fontVariant}>{version?.version ?? 'Loading...'}</Typography>
}

export function UsernameFromKey({ userId, fontVariant }: { userId: string; fontVariant: Variant }) {
  const { username, isUsernameError } = useGetUsernameFromInternalId(userId)
  if (isUsernameError) {
    return <Typography>Error getting version name</Typography>
  }
  return <Typography variant={fontVariant}>{username ?? 'Loading...'}</Typography>
}
