import { Divider } from '@mui/material'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import ReviewComment from 'src/reviews/ReviewComment'
import ReviewDecision from 'src/reviews/ReviewDecision'
import { AccessRequestInterface } from 'types/interfaces'
import { ReleaseInterface } from 'types/types'

type ReviewCommentsProps =
  | {
      release: ReleaseInterface
      accessRequest?: never
    }
  | {
      release?: never
      accessRequest: AccessRequestInterface
    }

export default function ReviewComments({ release, accessRequest }: ReviewCommentsProps) {
  const [modelId, semverOrAccessRequestIdObject] = useMemo(
    () =>
      release
        ? [release.modelId, { semver: release.semver }]
        : [accessRequest.modelId, { accessRequestId: accessRequest.id }],
    [release, accessRequest],
  )

  const {
    reviews: inactiveReviews,
    isReviewsLoading: isInactiveReviewsLoading,
    isReviewsError: isInactiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId,
    isActive: false,
    ...semverOrAccessRequestIdObject,
  })

  const reviewDetails = useMemo(
    () =>
      inactiveReviews.map((inactiveReview) =>
        inactiveReview.responses.map((response) => (
          <>
            {response.decision && <ReviewDecision user={response.user} decision={response.decision} />}
            {response.comment && <ReviewComment user={response.user} comment={response.comment} />}
          </>
        )),
      ),
    [inactiveReviews],
  )

  const error = MultipleErrorWrapper('Unable to load review responses', {
    isInactiveReviewsError,
  })

  if (error) return error

  return (
    <>
      {inactiveReviews.length > 0 && <Divider />}
      {isInactiveReviewsLoading && <Loading />}
      {reviewDetails}
    </>
  )
}
