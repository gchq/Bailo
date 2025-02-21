import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useMemo } from 'react'
import ApprovalsDisplay from 'src/entry/model/reviews/ApprovalsDisplay'
import { Decision, ResponseInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/dateUtils'
import { fromEntity } from 'utils/entityUtils'
import { plural } from 'utils/stringUtils'

export interface ReviewDisplayProps {
  modelId: string
  reviewResponses: ResponseInterface[]
  showCurrentUserResponses?: boolean
  currentUserDn?: string
}

export default function ReviewDisplay({
  reviewResponses,
  modelId,
  showCurrentUserResponses = false,
  currentUserDn,
}: ReviewDisplayProps) {
  const orderedReviewResponses = useMemo(
    () =>
      reviewResponses.toSorted(sortByCreatedAtDescending).filter((response) => {
        return currentUserDn !== undefined && showCurrentUserResponses
          ? fromEntity(response.entity).value === currentUserDn
          : response
      }) || [],
    [reviewResponses, currentUserDn, showCurrentUserResponses],
  )

  return (
    <>
      {orderedReviewResponses.length > 0 && orderedReviewResponses[0].decision === Decision.Approve && (
        <ApprovalsDisplay
          modelId={modelId}
          acceptedReviewResponses={orderedReviewResponses}
          showCurrentUserResponses={showCurrentUserResponses}
        />
      )}
      {orderedReviewResponses.length > 0 && orderedReviewResponses[0].decision === Decision.RequestChanges && (
        <Tooltip title={`${plural(orderedReviewResponses.length, 'review')}`}>
          <Stack direction='row'>
            <HourglassEmpty color='warning' fontSize='small' />
            <Typography variant='caption'>
              {showCurrentUserResponses ? 'You have requested changes' : 'Changes requested'}
            </Typography>
          </Stack>
        </Tooltip>
      )}
      {reviewResponses.length === 0 && <Typography variant='caption'>Awaiting review</Typography>}
    </>
  )
}
