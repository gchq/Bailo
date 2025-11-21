import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import { deleteModel } from 'actions/model'
import { useRouter } from 'next/router'
import { useState } from 'react'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'
import { toTitleCase } from 'utils/stringUtils'

type DangerZoneProps = {
  entry: EntryInterface
}

export default function DangerZone({ entry }: DangerZoneProps) {
  const [loading, setLoading] = useState(false)
  const sendNotification = useNotification()
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const [openConfirm, setOpenConfirm] = useState(false)
  const [confirmInput, setConfirmInput] = useState('')

  const handleDeleteEntry = async () => {
    setLoading(true)

    const response = await deleteModel(entry.id)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      sendNotification({
        variant: 'success',
        msg: 'Model deleted',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
      router.push('/')
    }

    setLoading(false)
    setOpenConfirm(false)
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6' component='h2'>
        Danger Zone!
      </Typography>
      <Button fullWidth variant='contained' color='error' onClick={() => setOpenConfirm(true)}>
        {`Delete ${toTitleCase(entry.kind)}`}
      </Button>
      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>{`Delete ${toTitleCase(entry.kind)}`}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            To confirm deletion, type <strong>{entry.name}</strong> below. This action cannot be undone.
          </Typography>
          <TextField
            fullWidth
            variant='outlined'
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={entry.name}
            autoFocus
            sx={{ mt: 2 }}
          />
          {errorMessage && <MessageAlert message={errorMessage} severity='error' />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirm(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            color='error'
            variant='contained'
            onClick={handleDeleteEntry}
            loading={loading}
            disabled={confirmInput.trim() !== entry.name}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
}
