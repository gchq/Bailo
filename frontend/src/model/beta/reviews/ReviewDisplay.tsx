import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import ApprovalsDisplay from 'src/model/beta/reviews/ApprovalsDisplay'
import { plural } from 'utils/stringUtils'

import { ReviewRequestInterface, ReviewResponseWithRole } from '../../../../types/interfaces'

interface ReviewDisplayProps {
  reviews: ReviewRequestInterface[]
}

export default function ReviewDisplay({ reviews }: ReviewDisplayProps) {
  const [acceptedReviewResponses, setAcceptedReviewResponses] = useState<ReviewResponseWithRole[]>([])
  const [changesRequestedReviewResponses, setChangesRequestedReviewResponses] = useState<ReviewResponseWithRole[]>([])

  useEffect(() => {
    const updatedApprovals: ReviewResponseWithRole[] = []
    const updatedRequests: ReviewResponseWithRole[] = []
    reviews.forEach((review) =>
      review.responses.forEach((reviewResponse) => {
        reviewResponse.decision === 'approve'
          ? updatedApprovals.push({ ...reviewResponse, role: review.role })
          : updatedRequests.push({ ...reviewResponse, role: review.role })
      }),
    )
    setAcceptedReviewResponses(updatedApprovals)
    setChangesRequestedReviewResponses(updatedRequests)
  }, [reviews])

  return (
    <>
      {changesRequestedReviewResponses.length === 0 && acceptedReviewResponses.length > 0 && (
        <ApprovalsDisplay modelId={reviews[0].model.id} acceptedReviewResponses={acceptedReviewResponses} />
      )}
      {changesRequestedReviewResponses.length > 0 && (
        <Tooltip title={`${plural(changesRequestedReviewResponses.length, 'review')}`}>
          <Stack direction='row'>
            <HourglassEmpty color='warning' fontSize='small' />
            <Typography variant='caption'>Changes requested</Typography>
          </Stack>
        </Tooltip>
      )}
      {changesRequestedReviewResponses.length === 0 && acceptedReviewResponses.length === 0 && (
        <Typography variant='caption'>Awaiting review</Typography>
      )}
    </>
  )
}
