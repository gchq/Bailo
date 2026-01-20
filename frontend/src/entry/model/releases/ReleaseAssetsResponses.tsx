import CommentIcon from '@mui/icons-material/ChatBubble'
import ListAltIcon from '@mui/icons-material/ListAlt'
import { IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useGetResponses } from 'actions/response'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useEffect, useState } from 'react'
import Loading from 'src/common/Loading'
import ReviewDisplay from 'src/entry/model/reviews/ReviewDisplay'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import { EntryInterface, ReleaseInterface, ResponseInterface } from 'types/types'
import { latestReviewsForEachUser } from 'utils/reviewUtils'

export interface ReleaseAssetsResponsesProps {
  model: EntryInterface
  release: ReleaseInterface
  includeResponses?: boolean
}

export default function ReleaseAssetsResponses({
  model,
  release,
  includeResponses = true,
}: ReleaseAssetsResponsesProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: model.id,
    semver: release.semver,
  })

  const {
    responses: commentResponses,
    isResponsesLoading: isCommentResponsesLoading,
    isResponsesError: isCommentResponsesError,
  } = useGetResponses([release._id])
  const {
    responses: reviewResponses,
    isResponsesLoading: isReviewResponsesLoading,
    isResponsesError: isReviewResponsesError,
  } = useGetResponses([...reviews.map((review) => review._id)])

  const [reviewsWithLatestResponses, setReviewsWithLatestResponses] = useState<ResponseInterface[]>([])

  useEffect(() => {
    if (!isReviewsLoading && reviews) {
      const latestReviews = latestReviewsForEachUser(reviews, reviewResponses)
      setReviewsWithLatestResponses(latestReviews)
    }
  }, [reviews, isReviewsLoading, reviewResponses])

  const error = MultipleErrorWrapper('Unable to load release', {
    isReviewResponsesError,
    isReviewsError,
    isCommentResponsesError,
  })
  if (error) {
    return error
  }

  return (
    <>
      {(isReviewsLoading || isCommentResponsesLoading || isReviewResponsesLoading) && <Loading />}
      <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={2}>
        {!release.minor && <ReviewDisplay modelId={model.id} reviewResponses={reviewsWithLatestResponses} />}
        {includeResponses && (reviewResponses.length > 0 || commentResponses.length > 0) && (
          <IconButton href={`/model/${release.modelId}/release/${release.semver}#responses`}>
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
                    <CommentIcon color='primary' />
                    <Typography variant='caption'>{commentResponses.length}</Typography>
                  </Stack>
                </Tooltip>
              )}
            </Stack>
          </IconButton>
        )}
      </Stack>
    </>
  )
}
