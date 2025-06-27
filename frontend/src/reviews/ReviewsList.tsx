import { List } from '@mui/material'
import { useGetReviewRequestsForUser } from 'actions/review'
import { memoize } from 'lodash-es'
import { useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import MessageAlert from 'src/MessageAlert'
import ReviewItem from 'src/reviews/ReviewItem'
import { ReviewListStatus, ReviewListStatusKeys, ReviewRequestInterface } from 'types/types'
import { isFinalised } from 'utils/reviewUtils'

type ReviewsListProps = {
  kind: 'release' | 'access'
  status: ReviewListStatusKeys
}

export default function ReviewsList({ kind, status }: ReviewsListProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser()
  const [filteredReviews, setFilteredReviews] = useState<ReviewRequestInterface[]>([])

  useEffect(() => {
    if (status === ReviewListStatus.ARCHIVED) {
      setFilteredReviews(
        reviews.filter((filteredReview) => filteredReview.kind === kind && isFinalised(filteredReview.decision)),
      )
    } else {
      setFilteredReviews(
        reviews.filter((filteredReview) => filteredReview.kind === kind && !isFinalised(filteredReview.decision)),
      )
    }
  }, [reviews, kind, status])

  const ReviewListItem = memoize(({ data, index }) => (
    <ReviewItem
      review={data[index]}
      key={`${data[index].model.id}-${data[index].semver || data[index].accessRequestId}-${data[index].role}`}
    />
  ))

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  return (
    <>
      {isReviewsLoading && <Loading />}
      <List>
        <Paginate
          list={filteredReviews.map((entryFile) => {
            return { key: entryFile._id, ...entryFile }
          })}
          emptyListText={`No reviews found`}
          sortingProperties={[
            { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
            { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
          ]}
          defaultSortProperty='createdAt'
          searchFilterProperty={kind === 'release' ? 'semver' : 'accessRequestId'}
          searchPlaceholderText={`Search for ${kind === 'release' ? 'semver' : 'access request name'}`}
        >
          {ReviewListItem}
        </Paginate>
      </List>
    </>
  )
}
