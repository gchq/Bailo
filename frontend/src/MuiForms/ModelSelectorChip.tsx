import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import EntryOverviewDetails from 'src/entry/EntryOverviewDetails'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'

interface ModelSelectorChipsProps {
  label: string
  modelId: string
}

export default function ModelSelectorChip({ label, modelId }: ModelSelectorChipsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { entry, isEntryLoading, isEntryError, mutateEntry } = useGetModel(isDialogOpen ? modelId : null)

  return (
    <>
      <Chip component='button' label={label} onClick={() => setIsDialogOpen(true)} sx={{ width: 'fit-content' }} />
      {entry && (
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth>
          <DialogTitle color='primary'>{label}</DialogTitle>
          <DialogContent>
            {isEntryLoading && <Loading />}
            {isEntryError && (
              <MessageAlert message='Unable to load model details. Please try again.' severity='error' />
            )}
            {entry && <EntryOverviewDetails entry={entry} mutateEntry={mutateEntry} dialogView />}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            <Button component={Link} href={`/model/${entry.id}`} variant='contained'>
              Go to Model
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}
