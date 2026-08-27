import { Button, Chip, Dialog, DialogActions, DialogContent } from '@mui/material'
import { useGetModel } from 'actions/entry'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import EntryOverviewDetails from 'src/entry/EntryOverviewDetails'
import MessageAlert from 'src/MessageAlert'

interface ModelSelectorChipsProps {
  label: string
  modelId: string
}

export default function ModelSelectorChip({ label, modelId }: ModelSelectorChipsProps) {
  const { entry, isEntryLoading, isEntryError, mutateEntry } = useGetModel(modelId)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (isEntryLoading) {
    return <Loading />
  }

  if (isEntryError) {
    return <MessageAlert message={isEntryError.info.message} severity='error' />
  }

  return (
    <>
      <Chip
        component='button'
        label={label}
        key={modelId}
        onClick={() => setIsDialogOpen(true)}
        sx={{ width: 'fit-content' }}
      />
      {entry && (
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth>
          <DialogContent>
            <EntryOverviewDetails entry={entry} mutateEntry={mutateEntry} showAsPopover />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            <Button variant='contained' href={`/model/${entry.id}`}>
              Go to Model
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}
