import { LoadingButton } from '@mui/lab'
import { Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { EntryInterface } from 'types/types'
import { toTitleCase } from 'utils/stringUtils'

type DangerZoneProps = {
  entry: EntryInterface
}

export default function DangerZone({ entry }: DangerZoneProps) {
  const [loading, setLoading] = useState(false)

  const handleDeleteEntry = () => {
    setLoading(true)

    // TODO - Delete entry API request and setLoading(false) on success/fail
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h6' component='h2'>
        Danger Zone!
      </Typography>
      {/* TODO - Remove disabled prop when reenabling delete functionality */}
      <LoadingButton fullWidth variant='contained' disabled onClick={handleDeleteEntry} loading={loading}>
        {`Delete ${toTitleCase(entry.kind)}`}
      </LoadingButton>
    </Stack>
  )
}
