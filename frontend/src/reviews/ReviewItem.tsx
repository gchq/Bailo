import { Box, ListItem, ListItemButton, Stack, Typography } from '@mui/material'
import { useGetResponses } from 'actions/response'
import { useGetCurrentUser } from 'actions/user'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import Loading from 'src/common/Loading'
import ReviewDisplay from 'src/entry/model/reviews/ReviewDisplay'
import MessageAlert from 'src/MessageAlert'
import ReviewRoleDisplay from 'src/reviews/ReviewRoleDisplay'
import { ReviewKind, ReviewListStatus, ReviewListStatusKeys, ReviewRequestInterface } from 'types/types'
import { formatDateStringAsDayMonthAndYear, timeDifference } from 'utils/dateUtils'
import { toTitleCase } from 'utils/stringUtils'

type ReviewItemProps = {
  review: ReviewRequestInterface
  status: ReviewListStatusKeys
}

export default function ReviewItem({ review, status }: ReviewItemProps) {
  const router = useRouter()

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { responses, isResponsesLoading, isResponsesError } = useGetResponses([review._id])

  const isArchivedLifecycleReview = useMemo(() => {
    return review.kind === ReviewKind.LIFECYCLE && status === ReviewListStatus.ARCHIVED
  }, [review.kind, status])

  const determineReviewPath = () => {
    switch (review.kind) {
      case ReviewKind.RELEASE:
        return `release/${review.semver}`
      case ReviewKind.ACCESS:
        return `access-request/${review.accessRequestId}`
      case ReviewKind.LIFECYCLE:
        return `lifecycle/${review._id}`
    }
  }

  function handleListItemClick() {
    router.push(`/model/${review.model.id}/${determineReviewPath()}/review?role=${review.role}`)
  }

  const editedAdornment = useCallback(() => {
    if (review.updatedAt > review.createdAt) {
      return `Updated ${timeDifference(new Date(), new Date(review.updatedAt))}.`
    }
  }, [review.createdAt, review.updatedAt])

  const listItemContent = useMemo(() => {
    return (
      <Stack>
        <Stack spacing={1} direction='column' sx={{ justifyContent: 'flex-start' }}>
          <Typography sx={{ wordBreak: 'break-all', fontWeight: 'bold' }} color='primary' variant='h6' component='h2'>
            {review.model.name}
          </Typography>
          {review.dueDate && (
            <Typography>
              This review {isArchivedLifecycleReview ? 'was' : 'is'} due by{' '}
              <span style={{ fontWeight: 'bold' }}>{formatDateStringAsDayMonthAndYear(review.dueDate.toString())}</span>
            </Typography>
          )}
          {review.accessRequestId && (
            <Typography sx={{ wordBreak: 'break-all' }}>
              {toTitleCase(review.accessRequestId.substring(0, review.accessRequestId.lastIndexOf('-')))}
            </Typography>
          )}
          {review.semver && <Typography sx={{ wordBreak: 'break-all' }}>{review.semver}</Typography>}
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
        <ReviewRoleDisplay review={review} />
        {currentUser && (
          <ReviewDisplay
            modelId={review.model.id}
            reviewResponses={responses}
            showCurrentUserResponses
            currentUserDn={currentUser.dn}
          />
        )}
      </Stack>
    )
  }, [currentUser, editedAdornment, isArchivedLifecycleReview, responses, review])

  if (isResponsesError) {
    return <MessageAlert message={isResponsesError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  if (isCurrentUserLoading || isResponsesLoading) {
    return <Loading />
  }

  return (
    <>
      <ListItem disablePadding>
        {!isArchivedLifecycleReview && (
          <ListItemButton onClick={handleListItemClick} aria-label={`Review model ${review.model} ${review.semver}`}>
            {listItemContent}
          </ListItemButton>
        )}
        {isArchivedLifecycleReview && <Box sx={{ py: 1, px: 2 }}>{listItemContent}</Box>}
      </ListItem>
    </>
  )
}
