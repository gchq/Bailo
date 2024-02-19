import { Button, Dialog, DialogActions, DialogContent, TextField } from '@mui/material'
import { useState } from 'react'

interface TextUploadDialogProps {
  open: boolean
  setOpen: (isOpen: boolean) => void
  onSubmit: (formData: string) => void
  helperText?: string
  submitButtonText?: string
}

export default function TextInputDialog({
  open,
  setOpen,
  onSubmit,
  helperText = '',
  submitButtonText = 'Submit',
}: TextUploadDialogProps) {
  const [formData, setFormData] = useState('')

  function handleSubmit() {
    onSubmit(formData)
    setFormData('')
  }
  return (
    <Dialog maxWidth='lg' open={open} onClose={() => setOpen(false)}>
      <DialogContent sx={{ p: 2 }}>
        <TextField
          size='small'
          helperText={helperText}
          multiline
          rows={4}
          maxRows={20}
          value={formData}
          onChange={(e) => setFormData(e.target.value)}
        ></TextField>
      </DialogContent>
      <DialogActions sx={{ pr: 2, pt: 0 }}>
        <Button variant='contained' disabled={formData.length === 0} onClick={handleSubmit}>
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
