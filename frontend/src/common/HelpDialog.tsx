import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material'
import { ReactNode, useState } from 'react'

type HelpDialogProps = {
  title: string
  content: ReactNode
}

export default function HelpDialog({ title, content }: HelpDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip title={title}>
        <IconButton size='small' onClick={() => setOpen(true)}>
          <HelpOutlineIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' disableEscapeKeyDown>
        <DialogTitle>{title}</DialogTitle>
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
