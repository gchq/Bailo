import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { Transition } from 'src/common/Transition'

interface CreatePathDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (path: string) => void
  currentPath: string
}

function validatePath(path: string): string | null {
  if (!path.trim()) {
    return 'Path cannot be empty'
  }
  if (path.startsWith('/') || path.endsWith('/')) {
    return 'Path should not start or end with a slash'
  }
  if (path.includes('//')) {
    return 'Path should not contain double slashes'
  }
  const segments = path.split('/')
  if (segments.some((s) => !s.trim())) {
    return 'Path contains empty segments'
  }
  return null
}

export default function CreatePathDialog({ open, onClose, onConfirm, currentPath }: CreatePathDialogProps) {
  const [path, setPath] = useState('')
  const validationError = path ? validatePath(path) : null
  const fullPath = currentPath ? `${currentPath}/${path}` : path

  const handleConfirm = () => {
    if (!path || validationError) {
      return
    }
    onConfirm(fullPath)
    setPath('')
  }

  const handleClose = () => {
    setPath('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm' slots={{ transition: Transition }}>
      <DialogTitle>Create folder path</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label='Folder path'
          placeholder='e.g. models/v2/weights'
          value={path}
          onChange={(e) => setPath(e.target.value)}
          error={!!validationError}
          helperText={validationError}
          sx={{ mt: 1 }}
        />
        {path && !validationError && (
          <Alert severity='info' sx={{ mt: 2 }}>
            <Typography variant='body2'>
              Folder <strong>{fullPath}</strong> will be created
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button color='secondary' variant='outlined' onClick={handleClose}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleConfirm} disabled={!path || !!validationError}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
