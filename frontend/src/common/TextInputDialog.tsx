import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useState } from 'react'
import LimitedTextField from 'src/common/LimitedTextField'
import { Transition } from 'src/common/Transition'
import { DESCRIPTION_INPUT_MAX_LENGTH } from 'utils/inputLimits'

interface TextUploadDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (formData: string) => void
  helperText?: string
  submitButtonText?: string
  dialogTitle?: string
}

export default function TextInputDialog({
  open,
  onClose,
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
    <Dialog maxWidth='lg' open={open} onClose={onClose} slots={{ transition: Transition }}>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <LimitedTextField
          size='small'
          helperText={helperText}
          multiline
          minRows={10}
          maxRows={15}
          value={formData}
          maxLength={DESCRIPTION_INPUT_MAX_LENGTH}
          onChange={(e) => setFormData(e.target.value)}
          sx={{ minWidth: '500px' }}
        />
      </DialogContent>
      <DialogActions sx={{ pr: 2, pt: 0 }}>
        <Button variant='outlined' onClick={onClose}>
          Cancel
        </Button>
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
