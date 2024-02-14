import { List } from '@mui/material'
import { useGetReviewRequestsForUser } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { useCallback, useEffect, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import ReviewItem from 'src/reviews/ReviewItem'
import { ReviewRequestInterface } from 'types/v2/types'

type ReviewsListProps = {
  kind: 'release' | 'access' | 'archived'
}

export default function ReviewsList({ kind }: ReviewsListProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const [filteredReviews, setFilteredReviews] = useState<ReviewRequestInterface[]>([])

  const containsUserResponse = useCallback(
    (review: ReviewRequestInterface) => {
      return currentUser && review.responses.find((response) => response.user === `user:${currentUser.dn}`)
    },
    [currentUser],
  )

  useEffect(() => {
    if (kind === 'archived') {
      setFilteredReviews(reviews.filter((filteredReview) => containsUserResponse(filteredReview)))
    } else {
      setFilteredReviews(
        reviews.filter((filteredReview) => filteredReview.kind === kind && !containsUserResponse(filteredReview)),
      )
    }
  }, [reviews, kind, containsUserResponse])

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
