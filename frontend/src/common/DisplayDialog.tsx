import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { ReactNode } from 'react'
import { Transition } from 'src/common/Transition'

type DisplayDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  titleColor?: string
}

export default function DisplayDialog({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm',
  titleColor,
}: DisplayDialogProps) {
  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth={maxWidth} slots={{ transition: Transition }}>
      <DialogTitle color={titleColor}>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
