import { List } from '@mui/material'
import { useGetResponses } from 'actions/response'
import { useGetReviewRequestsForUser } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { memoize } from 'lodash-es'
import { useCallback, useEffect, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
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
            response.entity === `user:${currentUser.dn}` &&
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

  const ReviewListItem = memoize(({ data, index }) => (
    <ReviewItem
      review={data[index]}
      key={`${data[index].model.id}-${data[index].semver || data[index].accessRequestId}-${data[index].role}`}
    />
  ))

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
