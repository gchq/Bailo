import { useGetReviewRequestsForUser } from 'actions/review'
import { memoize } from 'lodash-es'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import MessageAlert from 'src/MessageAlert'
import ReviewItem from 'src/reviews/ReviewItem'
import { ReviewListStatusKeys } from 'types/types'

type ReviewsListProps = {
  kind: 'release' | 'access'
  status: ReviewListStatusKeys
}

export default function ReviewsList({ kind, status }: ReviewsListProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForUser(status === 'open')

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
        searchFilterProperty={kind === 'release' ? 'semver' : 'accessRequestId'}
        searchPlaceholderText={`Search for ${kind === 'release' ? 'semver' : 'access request name'}`}
      >
        {ReviewListItem}
      </Paginate>
    </>
  )
}
