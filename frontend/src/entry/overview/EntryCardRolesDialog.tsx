import { DialogTitle } from '@mui/material'
import Dialog from '@mui/material/Dialog'
import { Transition } from 'src/common/Transition'
import EntryRoleList from 'src/entry/overview/EntryRoleList'
import { EntryInterface } from 'types/types'

type EntryCardRoleDialogProps = {
  entry: EntryInterface
  open: boolean
  setOpen: (isOpen: boolean) => void
}

export default function EntryCardRolesDialog({ entry, open, setOpen }: EntryCardRoleDialogProps) {
  // const theme = useTheme()
  // const { isModelError: isEntryError, mutateModel: mutateEntry } = useGetModel(entry.id, entry.kind)
  // const {
  //   modelRoles: entryRoles,
  //   isModelRolesLoading: isEntryRolesLoading,
  //   isModelRolesError: isEntryRolesError,
  // } = useGetModelRoles(entry.id)

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm' TransitionComponent={Transition}>
        <DialogTitle>Roles</DialogTitle>
        <EntryRoleList entry={entry} />
      </Dialog>
    </>
  )
}
