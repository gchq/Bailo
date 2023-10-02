import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Box, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'

import { useGetModelRoles } from '../../../../actions/model'
import { ReviewRequestInterface } from '../../../../types/interfaces'
import { ApprovalStates } from '../../../../types/v2/enums'
import { getRoleDisplay } from '../../../../utils/beta/roles'
import Loading from '../../../common/Loading'
import MessageAlert from '../../../MessageAlert'

interface ModelReleaseReviewDisplayProps {
  review: ReviewRequestInterface
}

export default function ModelReleaseReviewDisplay({ review }: ModelReleaseReviewDisplayProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(review.model.id)

  const acceptedReviewResponses = useMemo(() => {
    return review.responses
      .filter((response) => response.decision === ApprovalStates.Accepted)
      .map((response) => (
        <Stack direction='row' spacing={1} key={`${response.user}-${response.decision}`}>
          <Done color='success' fontSize='small' />
          <Typography variant='caption'>
            <Box component='span' sx={{ fontWeight: 'bold' }}>
              {response.user.split(':')[1]}
            </Box>
            {` has approved this release (${getRoleDisplay(review.role, modelRoles)})`}
          </Typography>
        </Stack>
      ))
  }, [review, modelRoles])

  const changesRequestedReviewResponses = useMemo(() => {
    return review.responses
      .filter((response) => response.decision === ApprovalStates.RequestChanges)
      .map((response) => (
        <Stack direction='row' spacing={1} key={`${response.user}-${response.decision}`}>
          <HourglassEmpty color='warning' fontSize='small' />
          <Typography variant='caption'>
            <Box component='span' sx={{ fontWeight: 'bold' }}>
              {response.user.split(':')[0]}
            </Box>
            {` has requested changes for this release (${getRoleDisplay(review.role, modelRoles)})`}
          </Typography>
        </Stack>
      ))
  }, [review, modelRoles])

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }
  return (
    <>
      {isModelRolesLoading && <Loading />}
      <Stack direction={{ sm: 'row', xs: 'column' }}>
        {acceptedReviewResponses}
        {changesRequestedReviewResponses}
      </Stack>
    </>
  )
}
