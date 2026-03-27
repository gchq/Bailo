import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { Transition } from 'src/common/Transition'
import { ReleaseInterface } from 'types/types'

import AssociatedImageReleasesList from './AssociatedImageReleasesList'

interface AssociatedImageReleasesDialogProps {
  modelId: string
  releases: ReleaseInterface[]
  latestRelease: string
  open: boolean
  onClose: () => void
}

export default function AssociatedImageReleasesDialog({
  modelId,
  releases,
  latestRelease,
  open,
  onClose,
}: AssociatedImageReleasesDialogProps) {
  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth='sm' slots={{ transition: Transition }}>
      <DialogTitle>Associated Releases</DialogTitle>
      <DialogContent>
        <AssociatedImageReleasesList modelId={modelId} releases={releases} latestRelease={latestRelease} />
      </DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
