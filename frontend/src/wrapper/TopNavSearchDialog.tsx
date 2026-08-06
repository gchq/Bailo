import { Dialog, DialogContent } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Transition } from 'src/common/Transition'
import EntrySearch from 'src/wrapper/EntrySearch'

type TopNavSearchDialogProps = {
  open: boolean
  setOpen: (isOpen: boolean) => void
}

export default function TopNavSearchDialog({ open, setOpen }: TopNavSearchDialogProps) {
  const theme = useTheme()
  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm' slots={{ transition: Transition }}>
      <DialogContent
        sx={{
          background: theme.palette.container.main,
        }}
      >
        <EntrySearch />
      </DialogContent>
    </Dialog>
  )
}
