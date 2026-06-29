import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { postImportModelCardText } from 'actions/modelCard'
import { useState } from 'react'
import { Transition } from 'src/common/Transition'
import { getErrorMessage } from 'utils/fetcher'

interface ImportModelCardTextDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (metadata: Record<string, unknown>, warnings: string[]) => void
  modelId: string
}

export default function ImportModelCardTextDialog({
  open,
  onClose,
  onSubmit,
  modelId,
}: ImportModelCardTextDialogProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleExtract() {
    setLoading(true)
    setErrorMessage('')

    const response = await postImportModelCardText(modelId, text)

    if (response.status && response.status < 400) {
      onSubmit(response.data.metadata, response.data.warnings || [])
      setText('')
    } else {
      setErrorMessage(typeof response.data === 'string' ? response.data : await getErrorMessage(response.data))
    }

    setLoading(false)
  }

  function handleClose() {
    if (!loading) {
      setErrorMessage('')
      onClose()
    }
  }

  return (
    <Dialog
      maxWidth='md'
      fullWidth
      open={open}
      onClose={handleClose}
      slots={{ transition: Transition }}
      sx={{ '& .MuiDialog-paper': { height: '100%' } }}
    >
      <DialogTitle>Import Model Card from Text</DialogTitle>
      <DialogContent sx={{ p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Typography variant='body2' sx={{ mb: 2 }}>
          Paste the contents of an existing model card (e.g. from HuggingFace, a system card, or other documentation).
          An LLM will extract relevant information into your schema fields.
        </Typography>
        <Alert severity='warning' sx={{ mb: 2 }}>
          You must review any information provided for correctness. AI-extracted data may be incomplete or inaccurate.
        </Alert>
        <TextField
          size='small'
          placeholder='Paste model card text here...'
          multiline
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
          fullWidth
          sx={{
            flex: '1 1 auto',
            overflow: 'hidden',
            '& .MuiInputBase-root': { height: '100%' },
            '& .MuiInputBase-input': { height: '100% !important', overflow: 'auto !important' },
          }}
        />
        {errorMessage && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {errorMessage}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ pr: 2, pt: 0 }}>
        <Button variant='outlined' onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant='contained'
          disabled={text.length === 0 || loading}
          onClick={handleExtract}
          loading={loading}
          data-test='importModelCardTextButton'
          startIcon={<AutoAwesomeIcon />}
        >
          Extract
        </Button>
      </DialogActions>
    </Dialog>
  )
}
