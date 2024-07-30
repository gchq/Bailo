import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { Transition } from 'src/common/Transition'
import MessageAlert from 'src/MessageAlert'

type ConfirmationDialogProps = {
  open: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
  dialogMessage?: string
  errorMessage?: string
}

export default function ConfirmationDialogue({
  open,
  title,
  onCancel,
  onConfirm,
  errorMessage = '',
  dialogMessage = 'Are you sure you want to perform this action?',
}: ConfirmationDialogProps) {
  return (
    <Dialog fullWidth open={open} onClose={onCancel} TransitionComponent={Transition}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{dialogMessage}</Typography>
        <MessageAlert message={errorMessage} severity='error' />
      </DialogContent>
      <DialogActions>
        <Button color='secondary' variant='outlined' onClick={onCancel}>
          Cancel
        </Button>
        <Button variant='contained' onClick={onConfirm} autoFocus data-test='confirmButton'>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
