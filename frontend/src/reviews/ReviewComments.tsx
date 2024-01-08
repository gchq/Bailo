import { Button, Divider, Stack, TextField, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { submitAccessRequestComment, useGetAccessRequest } from 'actions/accessRequest'
import { putRelease, useGetRelease } from 'actions/release'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import ReviewCommentDisplay from 'src/reviews/ReviewCommentDisplay'
import ReviewDecisionDisplay from 'src/reviews/ReviewDecisionDisplay'
import { AccessRequestInterface, ReviewResponse } from 'types/interfaces'
import { isReviewResponse, ReleaseInterface, ReviewComment, ReviewResponseKind } from 'types/types'
import { sortByCreatedAtAscending } from 'utils/dateUtils'

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
  const [newReviewComment, setNewReviewComment] = useState('')
  const [commentSubmissionError, setCommentSubmissionError] = useState('')
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const { mutateRelease } = useGetRelease(release?.modelId, release?.semver)
  const { mutateAccessRequest } = useGetAccessRequest(accessRequest?.modelId, accessRequest?.id)

  const theme = useTheme()

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

  const reviewDetails = useMemo(() => {
    let decisionsAndComments: Array<ReviewResponseKind> = []
    reviews.forEach((review) => {
      review.responses.forEach((response) => decisionsAndComments.push(response))
    })
    if (release && release.comments) {
      decisionsAndComments = [...decisionsAndComments, ...release.comments]
    }
    if (accessRequest && accessRequest.comments) {
      decisionsAndComments = [...decisionsAndComments, ...accessRequest.comments]
    }
    decisionsAndComments.sort(sortByCreatedAtAscending)
    return decisionsAndComments.map((response) => {
      if (isReviewResponse(response)) {
        return <ReviewDecisionDisplay key={response.createdAt} response={response as ReviewResponse} />
      } else {
        return <ReviewCommentDisplay key={response.createdAt} response={response as ReviewComment} />
      }
    })
  }, [reviews, release, accessRequest])

  async function submitReviewComment() {
    setCommentSubmissionError('')
    if (!newReviewComment) {
      setCommentSubmissionError('Please provide a comment before submitting.')
      return
    }
    if (currentUser) {
      const newComment: ReviewComment = {
        comment: newReviewComment,
        user: currentUser.dn,
        createdAt: new Date().toISOString(),
      }
      if (release) {
        const updatedRelease: ReleaseInterface = release
        if (!updatedRelease.comments) {
          updatedRelease.comments = []
        }
        updatedRelease.comments.push(newComment)
        const res = await putRelease(updatedRelease)
        if (res.ok) {
          mutateRelease()
          setNewReviewComment('')
        } else {
          setCommentSubmissionError(await res.json())
        }
      } else if (accessRequest) {
        const updatedAccessRequest: AccessRequestInterface = accessRequest
        if (!updatedAccessRequest.comments) {
          updatedAccessRequest.comments = []
        }
        updatedAccessRequest.comments.push(newComment)
        const res = await submitAccessRequestComment(
          accessRequest.modelId,
          accessRequest.id,
          updatedAccessRequest.comments,
        )
        if (res.ok) {
          mutateAccessRequest()
          setNewReviewComment('')
        } else {
          setCommentSubmissionError(await res.json())
        }
      } else {
        setCommentSubmissionError('There was a problem submitting this comment, please try again later.')
      }
    } else {
      setCommentSubmissionError('There was a fetching user information, please try again later.')
    }
  }

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {reviews.length > 0 && <Divider />}
      {isReviewsLoading && isCurrentUserLoading && <Loading />}
      {reviewDetails}
      <>
        <Stack spacing={1} justifyContent='center' alignItems='flex-end'>
          <TextField
            size='small'
            sx={{ width: '100%' }}
            placeholder='Add a comment'
            value={newReviewComment}
            onChange={(e) => setNewReviewComment(e.target.value)}
          ></TextField>
          <Button sx={{ mt: 1, float: 'right' }} variant='contained' onClick={submitReviewComment}>
            Submit comment
          </Button>
          <Typography variant='caption' color={theme.palette.error.light}>
            {commentSubmissionError}
          </Typography>
        </Stack>
      </>
    </>
  )
}
