import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Slide, Tooltip } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { forwardRef, ReactNode, useState } from 'react'

type HelpDialogProps = {
  title: string
  content: ReactNode
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction='up' ref={ref} {...props} />
})

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
      <Dialog
        open={open}
        onClose={handleClose}
        //maxWidth='md'
        keepMounted
        disableEscapeKeyDown
        TransitionComponent={Transition}
      >
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
