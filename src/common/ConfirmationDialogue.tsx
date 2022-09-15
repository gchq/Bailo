import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import Box from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import DialogContent from '@mui/material/DialogContent'

export default function ConfirmationDialogue({
  showConfirmationDialogue,
  confirmationModalTitle,
  confirmationContent,
  onCancel,
  onConfirm,
}: {
  showConfirmationDialogue: boolean
  confirmationModalTitle: string
  confirmationContent: JSX.Element

  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={showConfirmationDialogue} onClose={onCancel}>
      <DialogTitle id='alert-dialog-title'>{confirmationModalTitle}</DialogTitle>
      <DialogContent>
        <Typography>Are you want to perform this action?</Typography>
      </DialogContent>      
      {confirmationContent}
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
