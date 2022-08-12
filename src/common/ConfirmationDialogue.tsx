import Typography from '@mui/material/Typography'

import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import { useState } from 'react'
import { postEndpoint } from '../../data/api'
import EmptyBlob from './EmptyBlob'
import { RequestType, ReviewFilterType, useListRequests, useGetNumRequests } from '../../data/requests'


export default function ConfirmationDialogue({
  showConfirmationDialogue,
  functionOnConfirm,
  dialogueText,
}: {
  showConfirmationDialogue: boolean
  functionOnConfirm: Function
  dialogueText: string
}) {
  const [open, setOpen] = useState(false)
  
  const [confirmationModalText, setConfirmationModalText] = useState('')
  const [confirmationModalTitle, setConfirmationModalTitle] = useState('')
  const { requests, isRequestsLoading, isRequestsError, mutateRequests } = useListRequests(type, category)

  const handleClose = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onConfirm = () => {
    functionOnConfirm(); 
    setOpen(false)
  }

  return (
    <>
      {showConfirmationDialogue && (
        <Paper sx={{ mt: 2, mb: 2, pb: 2 }}>
          <Dialog open={open} onClose={handleClose}>
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
          <EmptyBlob text={dialogueText} />
        </Paper>
      )}
    </>
  )
}



