import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'

export default function ConfirmationDialogue({
  showConfirmationDialogue,
  confirmationModalTitle,
  confirmationModalText,
  onCancel,
  onConfirm,
}: {
  showConfirmationDialogue: boolean
  confirmationModalTitle: string
  confirmationModalText: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <Dialog open={showConfirmationDialogue} onClose={onCancel}>
        <DialogTitle id='alert-dialog-title'>{confirmationModalTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>{confirmationModalText}</DialogContentText>
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
    </>
  )
}
