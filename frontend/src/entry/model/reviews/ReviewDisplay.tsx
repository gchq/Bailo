import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useMemo } from 'react'
import ApprovalsDisplay from 'src/entry/model/reviews/ApprovalsDisplay'
import { Decision, ResponseInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/dateUtils'
import { plural } from 'utils/stringUtils'

export interface ReviewDisplayProps {
  modelId: string
  reviewResponses: ResponseInterface[]
}

export default function ReviewDisplay({ reviewResponses, modelId }: ReviewDisplayProps) {
  const orderedReviewResponses = useMemo(() => reviewResponses.sort(sortByCreatedAtDescending) || [], [reviewResponses])

  return (
    <>
      {orderedReviewResponses.length > 0 && orderedReviewResponses[0].decision === Decision.Approve && (
        <ApprovalsDisplay modelId={modelId} acceptedReviewResponses={orderedReviewResponses} />
      )}
      {orderedReviewResponses.length > 0 && orderedReviewResponses[0].decision === Decision.RequestChanges && (
        <Tooltip title={`${plural(orderedReviewResponses.length, 'review')}`}>
          <Stack direction='row'>
            <HourglassEmpty color='warning' fontSize='small' />
            <Typography variant='caption'>Changes requested</Typography>
          </Stack>
        </Tooltip>
      )}
      {reviewResponses.length === 0 && <Typography variant='caption'>Awaiting review</Typography>}
    </>
  )
}
