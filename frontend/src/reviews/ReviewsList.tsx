import { useGetReviewRequestsForUser } from 'actions/review'
import { memoize } from 'lodash-es'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import MessageAlert from 'src/MessageAlert'
import ReviewItem from 'src/reviews/ReviewItem'
import { ReviewKind, ReviewListStatusKeys } from 'types/types'

type ReviewsListProps = {
  kind: 'release' | 'access' | 'lifecycle'
  status: ReviewListStatusKeys
}

export default function ReviewsList({ kind, status }: ReviewsListProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser(status === 'open')

  const ReviewListItem = memoize(({ data }) => <ReviewItem review={data} key={`${data._id}`} status={status} />)

  const determineSearchFilterProperty = () => {
    switch (kind) {
      case ReviewKind.RELEASE:
        return 'semver'
      case ReviewKind.ACCESS:
        return 'accessRequestId'
      case ReviewKind.LIFECYCLE:
        return 'dueDate'
    }
  }

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  return (
    <>
      {isReviewsLoading && <Loading />}
      <Paginate
        list={reviews.map((entryFile) => {
          return { key: entryFile._id, ...entryFile }
        })}
        emptyListText={`No reviews found`}
        sortingProperties={[
          { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
          { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
        ]}
        defaultSortProperty='createdAt'
        searchFilterProperty={determineSearchFilterProperty()}
        searchPlaceholderText={'Search'}
      >
        {ReviewListItem}
      </Paginate>
    </>
  )
}
