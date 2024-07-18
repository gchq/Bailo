import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Slide, TextField } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { forwardRef, useState } from 'react'

interface TextUploadDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (formData: string) => void
  helperText?: string
  submitButtonText?: string
  dialogTitle?: string
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction='up' ref={ref} {...props} />
})

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
    <Dialog
      maxWidth='lg'
      open={open}
      onClose={onClose}
      keepMounted
      disableEscapeKeyDown
      TransitionComponent={Transition}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <TextField
          size='small'
          helperText={helperText}
          multiline
          minRows={10}
          maxRows={15}
          value={formData}
          onChange={(e) => setFormData(e.target.value)}
          sx={{ minWidth: '500px' }}
        ></TextField>
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
