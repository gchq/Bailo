import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import ApprovalsDisplay from 'src/entry/model/reviews/ApprovalsDisplay'
import { Decision, ResponseInterface } from 'types/types'
import { plural } from 'utils/stringUtils'

export interface ReviewDisplayProps {
  modelId: string
  reviewResponses: ResponseInterface[]
}

export default function ReviewDisplay({ reviewResponses, modelId }: ReviewDisplayProps) {
  const [acceptedReviewResponses, setAcceptedReviewResponses] = useState<ResponseInterface[]>([])
  const [changesRequestedReviewResponses, setChangesRequestedReviewResponses] = useState<ResponseInterface[]>([])

  useEffect(() => {
    const updatedApprovals: ResponseInterface[] = []
    const updatedRequests: ResponseInterface[] = []
    for (const reviewResponse of reviewResponses) {
      if (reviewResponse.decision === Decision.Approve) {
        updatedApprovals.push({ ...reviewResponse, role: reviewResponse.role })
      }
      if (reviewResponse.decision === Decision.RequestChanges) {
        updatedRequests.push({ ...reviewResponse, role: reviewResponse.role })
      }
    }
    setAcceptedReviewResponses(updatedApprovals)
    setChangesRequestedReviewResponses(updatedRequests)
  }, [reviewResponses])

  return (
    <>
      {changesRequestedReviewResponses.length === 0 && acceptedReviewResponses.length > 0 && (
        <ApprovalsDisplay modelId={modelId} acceptedReviewResponses={acceptedReviewResponses} />
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
