import Delete from '@mui/icons-material/Delete'
import { Button, Divider, Stack, Typography } from '@mui/material'
import { deleteEntry } from 'actions/entry'
import { useState } from 'react'
import DeletionConfirmationDialogue from 'src/common/DeletionConfirmationDialogue'
import { EntryInterface, EntryKindLabel } from 'types/types'
import { toTitleCase } from 'utils/stringUtils'

type EntryDeletionProps = {
  entry: EntryInterface
}

export default function EntryDeletion({ entry }: EntryDeletionProps) {
  const [openConfirm, setOpenConfirm] = useState(false)

  const entryKindLabel = toTitleCase(EntryKindLabel[entry.kind])

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography variant='h6' component='h2' color='primary'>
        Deletion
      </Typography>
      <Divider />
      <Button
        fullWidth
        variant='contained'
        color='error'
        onClick={() => setOpenConfirm(true)}
        data-test='deleteEntryButton'
        startIcon={<Delete />}
      >
        {`Delete ${entryKindLabel}`}
      </Button>
      <DeletionConfirmationDialogue
        open={openConfirm}
        title={`Delete ${entryKindLabel}`}
        onCancel={() => setOpenConfirm(false)}
        onDelete={() => deleteEntry(entry.id)}
        confirmationText={entry.name}
        successMessage={`${entryKindLabel} deleted`}
        redirectTo='/'
        confirmButtonDataTest='deleteEntryConfirm'
        confirmInputDataTest='deleteEntryInputVerification'
      />
    </Stack>
  )
}
