import Refresh from '@mui/icons-material/Refresh'
import { Button, Stack, Typography } from '@mui/material'
import { postNotifyReviewer } from 'actions/review'
import { ReactElement, useState } from 'react'
import Restricted from 'src/common/Restricted'
import useNotification from 'src/hooks/useNotification'
import { Decision, DecisionKeys, ReviewRequestInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface ReviewStatusDisplayProps {
  review: ReviewRequestInterface
  roleNameDisplay: () => string | undefined
  setErrorMessage: (errorMessage: string) => void
  showCurrentUserResponses: boolean
  icon: ReactElement
  decision: DecisionKeys
}

export function ReviewStatusDisplay({
  review,
  roleNameDisplay,
  setErrorMessage,
  showCurrentUserResponses,
  decision,
  icon,
}: ReviewStatusDisplayProps) {
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

  const currentUserDisplayDecision = () => {
    switch (decision) {
      case Decision.RequestChanges:
        return 'requested changes'
      case Decision.Reject:
        return 'rejected'
    }
  }

  const otherUserDisplayDecision = () => {
    switch (decision) {
      case Decision.RequestChanges:
        return 'Changes requested'
      case Decision.Reject:
        return 'Rejected'
    }
  }

  return (
    <Stack direction='row' key={review._id} sx={{ alignItems: 'center' }} spacing={1}>
      {icon}
      <Typography variant='caption'>
        {showCurrentUserResponses
          ? `You have ${currentUserDisplayDecision()} as a ${roleNameDisplay()}`
          : `${otherUserDisplayDecision()} by  ${roleNameDisplay()}`}
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
