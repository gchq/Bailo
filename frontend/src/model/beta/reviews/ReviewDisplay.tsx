import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Box, Stack, Typography } from '@mui/material'
import { ReactElement, useMemo } from 'react'
import UserDisplay from 'src/common/UserDisplay'

import { useGetModelRoles } from '../../../../actions/model'
import { ReviewRequestInterface } from '../../../../types/interfaces'
import { ApprovalStates } from '../../../../types/v2/enums'
import { getRoleDisplay } from '../../../../utils/beta/roles'
import Loading from '../../../common/Loading'
import MessageAlert from '../../../MessageAlert'

export interface ReviewDisplayProps {
  review: ReviewRequestInterface
}

export default function ReviewDisplay({ review }: ReviewDisplayProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(review.model.id)

  const reviewKindText = useMemo(() => (review.kind === 'release' ? 'release' : 'access request'), [review.kind])

  const { acceptedReviewResponses, changesRequestedReviewResponses } = useMemo(() => {
    return review.responses.reduce<{
      acceptedReviewResponses: ReactElement[]
      changesRequestedReviewResponses: ReactElement[]
    }>(
      (reviewResponses, reviewResponse) => {
        const isAccepted = reviewResponse.decision === ApprovalStates.Accepted

        const reviewResponseElement = (
          <Stack direction='row' spacing={1} key={`${reviewResponse.user}-${reviewResponse.decision}`}>
            {isAccepted ? (
              <Done color='success' fontSize='small' />
            ) : (
              <HourglassEmpty color='warning' fontSize='small' />
            )}
            <Typography variant='caption'>
              <Box component='span' fontWeight='bold'>
                <UserDisplay dn={reviewResponse.user} />
              </Box>
              {` has ${isAccepted ? 'approved' : 'requested changes for'} this ${reviewKindText} (${getRoleDisplay(
                review.role,
                modelRoles,
              )})`}
            </Typography>
          </Stack>
        )

        if (isAccepted) reviewResponses.acceptedReviewResponses.push(reviewResponseElement)
        else reviewResponses.changesRequestedReviewResponses.push(reviewResponseElement)

        return reviewResponses
      },
      { acceptedReviewResponses: [], changesRequestedReviewResponses: [] },
    )
  }, [review, modelRoles, reviewKindText])

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      <Stack>
        {acceptedReviewResponses}
        {changesRequestedReviewResponses}
      </Stack>
    </>
  )
}
