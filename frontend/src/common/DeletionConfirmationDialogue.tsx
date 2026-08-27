import Close from '@mui/icons-material/Close'
import Delete from '@mui/icons-material/Delete'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'
import { Transition } from 'src/common/Transition'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { getErrorMessage } from 'utils/fetcher'

type DeletionConfirmationDialogueProps = {
  open: boolean
  title: string
  /** Closes the dialogue. Called when the user cancels and after a successful deletion. */
  onClose: () => void
  /** Performs the delete request. The dialogue owns loading, error, notification and redirect. */
  onDelete: () => Promise<Response>
  /** When provided, the user must type this exact string before the delete button is enabled. */
  confirmationText?: string
  dialogMessage?: string
  /** Success snackbar text. Omit to send no notification. */
  successMessage?: string
  /** Route pushed on success. Omit to stay on the current page. */
  redirectTo?: string
  children?: ReactNode
  confirmButtonDataTest?: string
  confirmInputDataTest?: string
}

export default function DeletionConfirmationDialogue({
  open,
  title,
  onClose,
  onDelete,
  confirmationText,
  dialogMessage = 'Are you sure you want to perform this action? This action cannot be undone.',
  successMessage,
  redirectTo,
  children,
  confirmButtonDataTest = 'deleteConfirmButton',
  confirmInputDataTest = 'deleteInputVerification',
}: DeletionConfirmationDialogueProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmInput, setConfirmInput] = useState('')

  const sendNotification = useNotification()
  const router = useRouter()

  const isConfirmed = !confirmationText || confirmInput.trim() === confirmationText

  useEffect(() => {
    if (!open) {
      setConfirmInput('')
      setErrorMessage('')
    }
  }, [open])

  const handleDelete = async () => {
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await onDelete()

      if (!response.ok) {
        setErrorMessage(await getErrorMessage(response))
      } else {
        if (successMessage) {
          sendNotification({
            variant: 'success',
            msg: successMessage,
            anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
          })
        }
        if (redirectTo) {
          router.push(redirectTo)
        }
        onClose()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to complete the deletion request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      onKeyUp={(e) => {
        // Only offer the keyboard shortcut when the user has had to type the confirmation text, otherwise a stray
        // Enter - including the one that opened the dialogue - would delete without any confirmation at all.
        if (e.code === 'Enter' && confirmationText && isConfirmed && !loading) {
          handleDelete()
        }
      }}
      slots={{ transition: Transition }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {confirmationText ? (
          <>
            <Typography gutterBottom>
              To confirm deletion, type <strong>{confirmationText}</strong> below. This action cannot be undone.
            </Typography>
            <TextField
              fullWidth
              variant='outlined'
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={confirmationText}
              autoFocus
              sx={{ mt: 2 }}
              slotProps={{
                htmlInput: { 'data-test': confirmInputDataTest },
              }}
            />
          </>
        ) : (
          <Typography>{dialogMessage}</Typography>
        )}
        <MessageAlert message={errorMessage} severity='error' />
        {children}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} startIcon={<Close />}>
          Cancel
        </Button>
        <Button
          color='error'
          variant='contained'
          onClick={handleDelete}
          loading={loading}
          disabled={!isConfirmed}
          startIcon={<Delete />}
          data-test={confirmButtonDataTest}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
