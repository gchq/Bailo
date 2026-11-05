import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import Refresh from '@mui/icons-material/Refresh'
import { Button, Stack, Typography } from '@mui/material'
import { postNotifyReviewer } from 'actions/review'
import { useContext, useMemo, useState } from 'react'
import CurrentUserContext from 'src/contexts/currentUserContext'
import useNotification from 'src/hooks/useNotification'
import { EntityKind, type ReviewRequestInterface, SystemRole } from 'types/types'
import { toEntity } from 'utils/entityUtils'
import { getErrorMessage } from 'utils/fetcher'

const reReviewRoles: string[] = [SystemRole.Owner, SystemRole.Contributor]

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
  const currentUser = useContext(CurrentUserContext)

  const canRequestReReview = useMemo(() => {
    const currentUserEntity = toEntity(EntityKind.USER, currentUser.dn)
    return review.model.collaborators.some(
      (collaborator) =>
        collaborator.entity === currentUserEntity && collaborator.roles.some((role) => reReviewRoles.includes(role)),
    )
  }, [currentUser, review.model.collaborators])

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
      {canRequestReReview && (
        <Button
          size='small'
          onClick={() => handleNotifyReviewerOnClick(review._id)}
          startIcon={<Refresh />}
          loading={isNotifyButtonLoading}
        >
          Request re-review
        </Button>
      )}
    </Stack>
  )
}
