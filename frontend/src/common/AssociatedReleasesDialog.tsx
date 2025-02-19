import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { FileInterface, isFileInterface, ReleaseInterface } from 'types/types'

type AssociatedReleasesDialogProps = {
  modelId: string
  file: FileInterface | File
  open: boolean
  onClose: () => void
}

export default function AssociatedReleasesDialog({ modelId, file, open, onClose }: AssociatedReleasesDialogProps) {
  const { releases } = useGetReleasesForModelId(modelId)

  const associatedReleases: Array<ReleaseInterface> = releases.filter(
    (release) => isFileInterface(file) && release.fileIds.includes(file._id),
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Releases associated to {file.name}</DialogTitle>
      <DialogContent>{associatedReleases[0].semver}</DialogContent>
    </Dialog>
  )
}
