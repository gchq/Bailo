import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { Transition } from 'src/common/Transition'
import AssociatedReleasesList from 'src/entry/model/releases/AssociatedReleasesList'
import { FileInterface, ReleaseInterface } from 'types/types'

type AssociatedReleasesDialogProps = {
  modelId: string
  file: FileInterface | File
  sortedAssociatedReleases: Array<ReleaseInterface>
  latestRelease: string
  open: boolean
  onClose: () => void
}

export default function AssociatedReleasesDialog({
  modelId,
  file,
  sortedAssociatedReleases,
  latestRelease,
  open,
  onClose,
}: AssociatedReleasesDialogProps) {
  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth='sm' slots={{ transition: Transition }}>
      <DialogTitle>Associated Releases</DialogTitle>
      <DialogContent>
        <AssociatedReleasesList
          modelId={modelId}
          file={file}
          latestRelease={latestRelease}
          releases={sortedAssociatedReleases}
        />
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
