import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import Refresh from '@mui/icons-material/Refresh'
import { Button, Stack, Typography } from '@mui/material'
import { postNotifyReviewer } from 'actions/review'
import { useState } from 'react'
import Restricted from 'src/common/Restricted'
import useNotification from 'src/hooks/useNotification'
import { ReviewRequestInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface ChangesRequestedDisplayProps {
  review: ReviewRequestInterface
  roleNameDisplay: () => string | undefined
  setErrorMessage: (errorMessage: string) => void
  showCurrentUserResponses: boolean
}

export function ChangesRequestedDisplay({
  review,
  roleNameDisplay,
  setErrorMessage,
  showCurrentUserResponses,
}: ChangesRequestedDisplayProps) {
  const [isNotifyButtonLoading, setIsNotifyButtonLoading] = useState(false)
  const sendNotification = useNotification()

  const handleNotifyReviewerOnClick = async (reviewId: string) => {
    setIsNotifyButtonLoading(true)
    setErrorMessage('')
    const res = await postNotifyReviewer(reviewId)
    if (!res.ok) {
      if (res.status === 429) {
        setErrorMessage('Please wait before sending another request.')
      } else {
        setErrorMessage(await getErrorMessage(res))
      }
    } else {
      sendNotification({
        variant: 'success',
        msg: 'Reviewers have been notified.',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
    setIsNotifyButtonLoading(false)
  }

  return (
    <Stack direction='row' key={review._id} sx={{ alignItems: 'center' }} spacing={1}>
      <HourglassEmpty color='warning' fontSize='small' />
      <Typography variant='caption'>
        {showCurrentUserResponses
          ? `You have requested changes as a ${roleNameDisplay()}`
          : `Changes requested by  ${roleNameDisplay()}`}
      </Typography>
      <Restricted action='editRelease' fallback={<></>}>
        <>
          {
            <Button
              size='small'
              onClick={() => handleNotifyReviewerOnClick(review._id)}
              startIcon={<Refresh />}
              loading={isNotifyButtonLoading}
            >
              Request re-review
            </Button>
          }
        </>
      </Restricted>
    </Stack>
  )
}
