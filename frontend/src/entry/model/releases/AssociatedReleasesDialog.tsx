import DisplayDialog from 'src/common/DisplayDialog'
import AssociatedReleasesList from 'src/entry/model/releases/AssociatedReleasesList'
import { ReleaseInterface } from 'types/types'

type AssociatedReleasesDialogProps = {
  modelId: string
  sortedAssociatedReleases: Array<ReleaseInterface>
  latestRelease: string
  open: boolean
  onClose: () => void
}

export default function AssociatedReleasesDialog({
  modelId,
  sortedAssociatedReleases,
  latestRelease,
  open,
  onClose,
}: AssociatedReleasesDialogProps) {
  return (
    <DisplayDialog open={open} onClose={onClose} title='Associated Releases'>
      <AssociatedReleasesList modelId={modelId} latestRelease={latestRelease} releases={sortedAssociatedReleases} />
    </DisplayDialog>
  )
}
