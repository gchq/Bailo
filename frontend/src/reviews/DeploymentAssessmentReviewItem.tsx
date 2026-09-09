import { ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useCallback, useContext, useMemo } from 'react'
import CurrentUserContext from 'src/contexts/currentUserContext'
import ReviewStatus from 'src/entry/model/reviews/ReviewStatus'
import { ReviewRequestInterface } from 'types/types'
import { timeDifference } from 'utils/dateUtils'

type ReviewItemProps = {
  review: ReviewRequestInterface
}

export default function DeploymentAssessmentReviewItem({ review }: ReviewItemProps) {
  const currentUser = useContext(CurrentUserContext)
  const router = useRouter()

  function handleListItemClick() {
    router.push(`/deployment-assessments/${review.deploymentAssessmentId}/review`)
  }

  const editedAdornment = useCallback(() => {
    if (review.updatedAt > review.createdAt) {
      return `Updated ${timeDifference(new Date(), new Date(review.updatedAt))}.`
    }
  }, [review.createdAt, review.updatedAt])

  const listItemContent = useMemo(() => {
    if (review) {
      return (
        <Stack>
          <Stack spacing={1} direction='column' sx={{ justifyContent: 'flex-start' }}>
            <Typography sx={{ wordBreak: 'break-all', fontWeight: 'bold' }} color='primary' variant='h6' component='h2'>
              {review.deploymentAssessment?.name}
            </Typography>
          </Stack>
          <Stack spacing={1} direction='row' sx={{ justifyContent: 'flex-start', alignItems: 'center' }}>
            <Typography variant='caption'>{`Created ${timeDifference(
              new Date(),
              new Date(review.createdAt),
            )}.`}</Typography>
            <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
              {editedAdornment()}
            </Typography>
          </Stack>
          <ReviewStatus review={review} modelId={null} showCurrentUserResponses={currentUser !== undefined} />
        </Stack>
      )
    }
  }, [currentUser, editedAdornment, review])

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton onClick={handleListItemClick} aria-label={`Review deployment assessment`}>
          {listItemContent}
        </ListItemButton>
      </ListItem>
    </>
  )
}
