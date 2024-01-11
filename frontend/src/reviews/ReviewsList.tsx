import { List } from '@mui/material'
import { useGetReviewRequestsForUser } from 'actions/review'
import { useEffect, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import ReviewItem from 'src/reviews/ReviewItem'
import ReviewRoleDisplay from 'src/reviews/ReviewRoleDisplay'
import { ReviewRequestInterface } from 'types/interfaces'

type ReviewsListProps = {
  isActive?: boolean
  kind?: 'release' | 'access' | 'all'
}

export default function ReviewsList({ isActive = true, kind = 'all' }: ReviewsListProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser(isActive)
  const [filteredReviews, setFilteredReviews] = useState<ReviewRequestInterface[]>([])

  useEffect(() => {
    if (kind === 'all') {
      setFilteredReviews(reviews)
    } else {
      setFilteredReviews(reviews.filter((filteredReview) => filteredReview.kind === kind))
    }
  }, [reviews, kind])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  return (
    <>
      {isReviewsLoading && <Loading />}
      {filteredReviews.length === 0 && <EmptyBlob text='No reviews found' />}
      <List>
        {filteredReviews.map((review) => (
          <>
            <ReviewItem
              review={review}
              key={`${review.model.id}-${review.semver || review.accessRequestId}-${review.role}`}
            />
            <ReviewRoleDisplay review={review} />
          </>
        ))}
      </List>
    </>
  )
}
