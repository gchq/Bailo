import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material'
import { ReactNode, useState } from 'react'
import { Transition } from 'src/common/Transition'

type HelpDialogProps = {
  title: string
  content: ReactNode
}

export default function HelpDialog({ title, content }: HelpDialogProps) {
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Tooltip title={title}>
        <IconButton size='small' onClick={handleOpen}>
          <HelpOutlineIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={handleClose} maxWidth='md' TransitionComponent={Transition}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button color='secondary' variant='outlined' onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
