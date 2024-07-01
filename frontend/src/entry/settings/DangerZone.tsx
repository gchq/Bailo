import { LoadingButton } from '@mui/lab'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { EntryInterface } from 'types/types'
import { toTitleCase } from 'utils/stringUtils'

type DangerZoneProps = {
  entry: EntryInterface
  isReadOnly: boolean
  requiredRolesText: string
}

export default function DangerZone({ entry, isReadOnly, requiredRolesText }: DangerZoneProps) {
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
      <Tooltip title={requiredRolesText}>
        <span>
          {/* TODO - Set disabled to disabled={isReadOnly} when re-enabling delete functionality */}
          <LoadingButton
            fullWidth
            variant='contained'
            disabled={isReadOnly || true}
            onClick={handleDeleteEntry}
            loading={loading}
          >
            {`Delete ${toTitleCase(entry.kind)}`}
          </LoadingButton>
        </span>
      </Tooltip>
    </Stack>
  )
}
