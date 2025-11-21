import { Button, Stack, Typography } from '@mui/material'
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
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6' component='h2'>
        Danger Zone!
      </Typography>
      <Button fullWidth variant='contained' onClick={handleDeleteEntry} loading={loading}>
        {`Delete ${toTitleCase(entry.kind)}`}
      </Button>
      {/* TODO: add a confirmation popup */}
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
}
