import { Box } from '@mui/material'
import DisplayDialog from 'src/common/DisplayDialog'
import ReviewComments from 'src/reviews/ReviewComments'
import { EntryInterface, ReviewKind } from 'types/types'

type ReviewHistoryDialogProps = {
  open: boolean
  onClose: () => void
  entry: EntryInterface
  mutateEntry: () => void
}

export default function ReviewHistoryDialog({ entry, mutateEntry, open, onClose }: ReviewHistoryDialogProps) {
  return (
    <DisplayDialog
      open={open}
      onClose={onClose}
      title={`Lifecycle review history for ${entry.name}`}
      titleColor='primary'
      maxWidth='md'
    >
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
    </DisplayDialog>
  )
}
