import { LoadingButton } from '@mui/lab'
import { Box, Divider, Stack } from '@mui/material'
import { postAccessRequestComment, useGetAccessRequest } from 'actions/accessRequest'
import { postReleaseComment, useGetRelease } from 'actions/release'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import RichTextEditor from 'src/common/RichTextEditor'
import MessageAlert from 'src/MessageAlert'
import ReviewCommentDisplay from 'src/reviews/ReviewCommentDisplay'
import ReviewDecisionDisplay from 'src/reviews/ReviewDecisionDisplay'
import { AccessRequestInterface, ReleaseInterface, ResponseInterface, ResponseKind } from 'types/types'
import { sortByCreatedAtAscending } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'
import { reviewResponsesForEachUser } from 'utils/reviewUtils'

type ReviewCommentsProps = {
  isEdit: boolean
} & (
  | {
      release: ReleaseInterface
      accessRequest?: never
    }
  | {
      release?: never
      accessRequest: AccessRequestInterface
    }
)

export default function ReviewComments({ release, accessRequest, isEdit }: ReviewCommentsProps) {
  const [newReviewComment, setNewReviewComment] = useState('')
  const [commentSubmissionError, setCommentSubmissionError] = useState('')
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)
  const { mutateRelease } = useGetRelease(release?.modelId, release?.semver)
  const { mutateAccessRequest } = useGetAccessRequest(accessRequest?.modelId, accessRequest?.id)

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

  const hasResponseOrComment = useMemo(() => {
    const hasReviewResponse = !!reviews.find((review) => review.responses.length > 0)
    const hasComment = release ? release.comments.length > 0 : accessRequest.comments.length > 0
    return hasReviewResponse || hasComment
  }, [accessRequest, release, reviews])

  const reviewDetails = useMemo(() => {
    let decisionsAndComments: Array<ResponseInterface> = []
    const groupedResponses = reviewResponsesForEachUser(reviews)
    decisionsAndComments.push(...groupedResponses)
    if (release) {
      decisionsAndComments = [...decisionsAndComments, ...release.comments]
    }
    if (accessRequest) {
      decisionsAndComments = [...decisionsAndComments, ...accessRequest.comments]
    }
    decisionsAndComments.sort(sortByCreatedAtAscending)
    return decisionsAndComments.map((response) => {
      if (response.kind === ResponseKind.Review) {
        return <ReviewDecisionDisplay key={response.createdAt} response={response} modelId={modelId} />
      } else {
        return <ReviewCommentDisplay key={response.createdAt} response={response} />
      }
    })
  }, [reviews, release, accessRequest, modelId])

  async function submitReviewComment() {
    setCommentSubmissionError('')
    setSubmitButtonLoading(true)
    if (release) {
      const res = await postReleaseComment(modelId, release.semver, newReviewComment)
      if (res.ok) {
        mutateRelease()
        setNewReviewComment('')
      } else {
        setCommentSubmissionError(await getErrorMessage(res))
      }
    } else if (accessRequest) {
      const res = await postAccessRequestComment(accessRequest.modelId, accessRequest.id, newReviewComment)
      if (res.ok) {
        mutateAccessRequest()
        setNewReviewComment('')
      } else {
        setCommentSubmissionError(await getErrorMessage(res))
      }
    } else {
      setCommentSubmissionError('There was a problem submitting this comment, please try again later.')
    }
    setSubmitButtonLoading(false)
  }

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  return (
    <>
      {(hasResponseOrComment || !isEdit) && <Divider />}
      {isReviewsLoading && <Loading />}
      {reviewDetails}
      {!isEdit && (
        <Stack spacing={1} justifyContent='center' alignItems='flex-end'>
          <Box sx={{ width: '100%' }}>
            <RichTextEditor
              value={newReviewComment}
              onChange={(e) => setNewReviewComment(e)}
              textareaProps={{ placeholder: 'Add your comment here...' }}
            />
          </Box>
          <LoadingButton
            sx={{ mt: 1 }}
            variant='contained'
            onClick={submitReviewComment}
            loading={submitButtonLoading}
            disabled={!newReviewComment}
          >
            Add comment
          </LoadingButton>
          <MessageAlert severity='error' message={commentSubmissionError} />
        </Stack>
      )}
    </>
  )
}
