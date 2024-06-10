import { List } from '@mui/material'
import { useGetResponses } from 'actions/response'
import { useGetReviewRequestsForUser } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { useCallback, useEffect, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import ReviewItem from 'src/reviews/ReviewItem'
import { ReviewListStatus, ReviewListStatusKeys, ReviewRequestInterface } from 'types/types'

type ReviewsListProps = {
  kind: 'release' | 'access'
  status: ReviewListStatusKeys
}

export default function ReviewsList({ kind, status }: ReviewsListProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser()
  const { responses, isResponsesLoading, isResponsesError } = useGetResponses(reviews.map((review) => review._id))
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const [filteredReviews, setFilteredReviews] = useState<ReviewRequestInterface[]>([])

  const approvedByUser = useCallback(
    (review: ReviewRequestInterface) => {
      return (
        currentUser &&
        responses.find(
          (response) =>
            response.parentId === review._id &&
            response.user === `user:${currentUser.dn}` &&
            response.decision === 'approve',
        )
      )
    },
    [currentUser, responses],
  )

  useEffect(() => {
    if (status === ReviewListStatus.ARCHIVED) {
      setFilteredReviews(
        reviews.filter((filteredReview) => filteredReview.kind === kind && approvedByUser(filteredReview)),
      )
    } else {
      setFilteredReviews(
        reviews.filter((filteredReview) => filteredReview.kind === kind && !approvedByUser(filteredReview)),
      )
    }
  }, [reviews, kind, approvedByUser, status])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isResponsesError) {
    return <MessageAlert message={isResponsesError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {(isCurrentUserLoading || isReviewsLoading || isResponsesLoading) && <Loading />}
      {filteredReviews.length === 0 && <EmptyBlob text='No reviews found' />}
      <List>
        {filteredReviews.map((review) => (
          <ReviewItem
            review={review}
            key={`${review.model.id}-${review.semver || review.accessRequestId}-${review.role}`}
          />
        ))}
      </List>
    </>
  )
}
