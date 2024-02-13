import { List } from '@mui/material'
import { useGetReviewRequestsForUser } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { useCallback, useEffect, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import ReviewItem from 'src/reviews/ReviewItem'
import { Decision, ReviewRequestInterface } from 'types/v2/types'

type ReviewsListProps = {
  kind?: 'release' | 'access' | 'all'
}

export default function ReviewsList({ kind = 'all' }: ReviewsListProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const [filteredReviews, setFilteredReviews] = useState<ReviewRequestInterface[]>([])

  const doesNotContainUserApproval = useCallback(
    (review: ReviewRequestInterface) => {
      return (
        currentUser &&
        !review.responses.find(
          (response) => response.user === `user:${currentUser.dn}` && response.decision === Decision.Approve,
        )
      )
    },
    [currentUser],
  )

  useEffect(() => {
    if (kind === 'all') {
      setFilteredReviews(reviews)
    } else {
      setFilteredReviews(
        reviews.filter((filteredReview) => filteredReview.kind === kind && doesNotContainUserApproval(filteredReview)),
      )
    }
  }, [reviews, kind, doesNotContainUserApproval])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && isReviewsLoading && <Loading />}
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
