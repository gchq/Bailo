import { Divider } from '@mui/material'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
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

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId,
    ...semverOrAccessRequestIdObject,
  })

  const reviewDetails = useMemo(
    () =>
      reviews.map((review) =>
        review.responses.map((response) => <>{response.decision && <ReviewDecision response={response} />}</>),
      ),
    [reviews],
  )

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  return (
    <>
      {reviews.length > 0 && <Divider />}
      {isReviewsLoading && <Loading />}
      {reviewDetails}
    </>
  )
}
