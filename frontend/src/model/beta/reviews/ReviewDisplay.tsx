import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

import { useGetModelRoles } from '../../../../actions/model'
import { ReviewRequestInterface, ReviewResponse } from '../../../../types/interfaces'
import Loading from '../../../common/Loading'
import MessageAlert from '../../../MessageAlert'

interface ReviewDisplayProps {
  reviews: ReviewRequestInterface[]
}

interface ReviewResponseWithRole extends ReviewResponse {
  role: string
}

export default function ReviewDisplay({ reviews }: ReviewDisplayProps) {
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(
    reviews[0] ? reviews[0].model.id : undefined,
  )

  const [acceptedReviewResponses, setAcceptedReviewResponses] = useState<ReviewResponseWithRole[]>([])
  const [changesRequestedReviewResponses, setChangesRequestedReviewResponses] = useState<ReviewResponseWithRole[]>([])

  useEffect(() => {
    const updatedApprovals: ReviewResponseWithRole[] = []
    const updatedRequests: ReviewResponseWithRole[] = []
    if (reviews) {
      reviews.forEach((review) =>
        review.responses.forEach((reviewResponse) => {
          reviewResponse.decision === 'approve'
            ? updatedApprovals.push({ ...reviewResponse, role: review.role })
            : updatedRequests.push({ ...reviewResponse, role: review.role })
        }),
      )
      setAcceptedReviewResponses(updatedApprovals)
      setChangesRequestedReviewResponses(updatedRequests)
    }
  }, [reviews])

  const approvalsDisplay = () => {
    const staticRoles = ['owner', 'contributor', 'consumer']
    const dynamicRoles = modelRoles.filter((role) => !staticRoles.includes(role.id)).map((role) => role)
    const roleApprovals: string[] = []
    dynamicRoles.forEach((dynamicRole) => {
      const acceptedResponsesForRole = acceptedReviewResponses.filter(
        (acceptedResponse) => acceptedResponse.role === dynamicRole.id,
      )
      if (acceptedResponsesForRole.length > 0) roleApprovals.push(dynamicRole.name)
    })
    return roleApprovals.map((role) => (
      <Tooltip
        title={`${acceptedReviewResponses.length} approval${acceptedReviewResponses.length > 1 ? 's' : ''}`}
        key={role}
      >
        <Stack direction='row'>
          <Done color='success' fontSize='small' />
          <Typography variant='caption'>{`Approved by ${role}`}</Typography>
        </Stack>
      </Tooltip>
    ))
  }

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      {changesRequestedReviewResponses.length === 0 && acceptedReviewResponses.length > 0 && approvalsDisplay()}
      {changesRequestedReviewResponses.length > 0 && (
        <Tooltip
          title={`${changesRequestedReviewResponses.length} ${
            changesRequestedReviewResponses.length > 1 ? 'reviews' : 'review'
          } requesting changes`}
        >
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
