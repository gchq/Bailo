import { Box, Button, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import Dialog from '@mui/material/Dialog'
import { useCallback } from 'react'
import { Transition } from 'src/common/Transition'
import ReviewComments from 'src/reviews/ReviewComments'
import { EntryInterface, ReviewKind } from 'types/types'
type ReviewHistoryDialogProps = {
  open: boolean
  onClose: () => void
  entry: EntryInterface
  mutateEntry: () => void
}

export default function ReviewHistoryDialog({ entry, mutateEntry, open, onClose }: ReviewHistoryDialogProps) {
  const handleOnClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Dialog open={open} onClose={onClose} fullWidth slotProps={{ transition: Transition }} maxWidth='md'>
      <DialogTitle color='primary'>Lifecycle review history for {entry.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mx: 'auto' }}>
          <ReviewComments
            parentId={entry['_id']}
            entryId={entry.id}
            kind={ReviewKind.LIFECYCLE}
            isEdit={false}
            mutator={mutateEntry}
            showComments={false}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleOnClose()}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
