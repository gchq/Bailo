import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Button, Dialog, DialogContent, DialogTitle, Slide, Typography } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import React, { ReactNode } from 'react'

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction='up' ref={ref} {...props} />
})

type Props = {
  infoLabel: string
  dialogTitle: string
  content: ReactNode
  icon?: ReactNode
}

function HelpDialog({ infoLabel, dialogTitle, content, icon }: Props) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button size='small' onClick={() => setOpen(true)} endIcon={icon ? icon : <HelpOutlineIcon />}>
        <Typography variant='caption'>{infoLabel}</Typography>
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' TransitionComponent={Transition}>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>{content}</DialogContent>
      </Dialog>
    </>
  )
}
export default HelpDialog
