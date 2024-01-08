import { Button, Divider, Stack, TextField, Typography } from '@mui/material'
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
    decisionsAndComments.sort(sortByCreatedAtAscending)
    return decisionsAndComments.map((response) => {
      if (isReviewResponse(response)) {
        return <ReviewDecisionDisplay key={response.createdAt} response={response as ReviewResponse} />
      } else {
        return <ReviewCommentDisplay key={response.createdAt} response={response as ReviewComment} />
      }
    })
  }, [reviews, release])

  async function submitReviewComment() {
    if (release && currentUser) {
      const updatedRelease: ReleaseInterface = release
      if (!updatedRelease.comments) {
        updatedRelease.comments = []
      }
      const newComment: ReviewComment = {
        comment: newReviewComment,
        user: currentUser.dn,
        createdAt: new Date().toISOString(),
      }
      updatedRelease.comments.push(newComment)
      const res = await putRelease(updatedRelease)
      if (res.ok) {
        mutateRelease()
        setNewReviewComment('')
      } else {
        setCommentSubmissionError(await res.json())
      }
    } else {
      setCommentSubmissionError('There was a problem submitting this comment, please try again later.')
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
          <Typography variant='caption'>{commentSubmissionError}</Typography>
        </Stack>
      </>
    </>
  )
}
