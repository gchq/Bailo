import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import React from 'react'

type ConfirmationDialogProps = {
  open: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
  errorMessage?: string
}

export default function ConfirmationDialogue({
  open,
  title,
  onCancel,
  onConfirm,
  errorMessage = '',
}: ConfirmationDialogProps) {
  return (
    <Dialog fullWidth open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to perform this action?</Typography>
        {errorMessage !== '' && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
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
