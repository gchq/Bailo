import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'
import { ReactNode, useState } from 'react'

type HelpDialogProps = {
  dialogTitle: string
  content: ReactNode
}

export default function HelpDialog({ dialogTitle, content }: HelpDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton size='small' onClick={() => setOpen(true)}>
        <HelpOutlineIcon />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' disableEscapeKeyDown>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button color='secondary' variant='outlined' onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
