import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import Dialog from '@mui/material/Dialog'
import { DatePicker } from '@mui/x-date-pickers'
import { PickerValue } from '@mui/x-date-pickers/internals'
import { postReview } from 'actions/review'
import { useCallback, useState } from 'react'
import { Transition } from 'src/common/Transition'
import useNotification from 'src/hooks/useNotification'
import { ReviewKind } from 'types/types'
import { increaseCurrentDateInDays } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'

type EntryRolesDialogProps = {
  open: boolean
  onClose: () => void
  entryId: string
}

export default function ReviewDateDialog({ open, onClose, entryId }: EntryRolesDialogProps) {
  const [reviewDate, setReviewDate] = useState<PickerValue>()

  const sendNotification = useNotification()

  const handleConfirmReviewDate = useCallback(async () => {
    const res = await postReview({ modelId: entryId, kind: ReviewKind.LIFECYCLE, dueDate: reviewDate })
    if (res.ok) {
      onClose()
    } else {
      sendNotification({ msg: await getErrorMessage(res), variant: 'error' })
    }
  }, [entryId, onClose, reviewDate, sendNotification])

  const handleOnClose = useCallback(() => {
    setReviewDate(null)
    onClose()
  }, [onClose])

  return (
    <Dialog open={open} onClose={onClose} fullWidth slotProps={{ transition: Transition }}>
      <DialogTitle color='primary'>Set a review date for this model card</DialogTitle>
      <DialogContent sx={{ m: 'auto' }}>
        <DatePicker
          value={reviewDate}
          sx={{ backgroundColor: 'unset', borderRadius: 1 }}
          onChange={(newValue) => {
            setReviewDate(newValue)
          }}
          minDate={increaseCurrentDateInDays(1)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleOnClose()}>Cancel</Button>
        <Button onClick={() => handleConfirmReviewDate()} disabled={!reviewDate}>
          Set review date
        </Button>
      </DialogActions>
    </Dialog>
  )
}
