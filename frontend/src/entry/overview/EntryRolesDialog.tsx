import { DialogContent, DialogTitle } from '@mui/material'
import Dialog from '@mui/material/Dialog'
import { Transition } from 'src/common/Transition'
import EntryRoleList from 'src/entry/overview/EntryRoleList'
import { EntryInterface } from 'types/types'

type EntryRoleDialogProps = {
  entry: EntryInterface
  open: boolean
  onClose: () => void
}

export default function EntryRolesDialog({ entry, open, onClose }: EntryRoleDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md' TransitionComponent={Transition}>
      <DialogTitle>Roles</DialogTitle>
      <DialogContent>
        <EntryRoleList entry={entry} />
      </DialogContent>
    </Dialog>
  )
}
