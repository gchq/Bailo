import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { useState } from 'react'

interface TextUploadDialogProps {
  open: boolean
  setOpen: (isOpen: boolean) => void
  onSubmit: (formData: string) => void
  helperText?: string
  submitButtonText?: string
  dialogTitle?: string
}

export default function TextInputDialog({
  open,
  setOpen,
  onSubmit,
  helperText = '',
  dialogTitle = '',
  submitButtonText = 'Submit',
}: TextUploadDialogProps) {
  const [formData, setFormData] = useState('')

  function handleSubmit() {
    onSubmit(formData)
    setFormData('')
  }
  return (
    <Dialog maxWidth='lg' open={open} onClose={() => setOpen(false)}>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <TextField
          size='small'
          helperText={helperText}
          multiline
          rows={10}
          maxRows={15}
          value={formData}
          onChange={(e) => setFormData(e.target.value)}
          sx={{ minWidth: '500px' }}
        ></TextField>
      </DialogContent>
      <DialogActions sx={{ pr: 2, pt: 0 }}>
        <Button
          variant='contained'
          disabled={formData.length === 0}
          onClick={handleSubmit}
          data-test='dialogSubmitButton'
        >
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
