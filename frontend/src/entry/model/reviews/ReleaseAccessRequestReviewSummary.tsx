import CommentIcon from '@mui/icons-material/ChatBubble'
import ListAltIcon from '@mui/icons-material/ListAlt'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useGetResponses } from 'actions/response'
import { useGetReviewRequestsForModel } from 'actions/review'
import Loading from 'src/common/Loading'
import ReviewStatus from 'src/entry/model/reviews/ReviewStatus'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import { AccessRequestInterface, ReleaseInterface } from 'types/types'
import { latestReviewsForEachUser } from 'utils/reviewUtils'

export type ReleaseAccessRequestReviewSummaryPops =
  | {
      release: ReleaseInterface
      accessRequest?: never
      includeResponsesSummary?: boolean
    }
  | {
      release?: never
      accessRequest: AccessRequestInterface
      includeResponsesSummary?: boolean
    }

export default function ReleaseAccessRequestReviewSummary({
  accessRequest,
  release,
  includeResponsesSummary = true,
}: ReleaseAccessRequestReviewSummaryPops) {
  const _id = release ? release._id : accessRequest._id
  const modelId = release ? release.modelId : accessRequest.modelId
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId,
    ...(release ? { semver: release.semver } : { accessRequestId: accessRequest.id }),
  })

  const {
    responses: commentResponses,
    isResponsesLoading: isCommentResponsesLoading,
    isResponsesError: isCommentResponsesError,
  } = useGetResponses([_id])
  const {
    responses: reviewResponses,
    isResponsesLoading: isReviewResponsesLoading,
    isResponsesError: isReviewResponsesError,
  } = useGetResponses([...reviews.map((review) => review._id)])

  const error = MultipleErrorWrapper('Unable to load review content', {
    isReviewResponsesError,
    isReviewsError,
    isCommentResponsesError,
  })
  if (error) {
    return error
  }

  if (isReviewsLoading || isCommentResponsesLoading || isReviewResponsesLoading) {
    return <Loading />
  }

  return (
    reviews.length > 0 && (
      <>
        <Stack
          direction='row'
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {reviews.length > 0 && (
            <ReviewStatus modelId={modelId} reviewResponses={latestReviewsForEachUser(reviews, reviewResponses)} />
          )}
          {includeResponsesSummary && (
            <IconButton
              href={
                `/model/${modelId}` +
                (release ? `/release/${release.semver}` : `/accessRequest/${accessRequest.id}`) +
                `#responses`
              }
            >
              <Stack direction='row' spacing={2}>
                {reviewResponses.length > 0 && (
                  <Tooltip title='Reviews'>
                    <Stack direction='row' spacing={1}>
                      <ListAltIcon color='primary' />
                      <Typography variant='caption'>{reviewResponses.length}</Typography>
                    </Stack>
                  </Tooltip>
                )}
                {commentResponses.length > 0 && (
                  <Tooltip title='Comments'>
                    <Stack direction='row' spacing={1}>
                      <CommentIcon data-test='commentIcon' color='primary' />
                      <Typography data-test='commentCount' variant='caption'>
                        {commentResponses.length}
                      </Typography>
                    </Stack>
                  </Tooltip>
                )}
              </Stack>
            </IconButton>
          )}
        </Stack>
      </>
    )
  )
}
