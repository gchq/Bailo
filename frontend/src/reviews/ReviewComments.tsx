import { LoadingButton } from '@mui/lab'
import { Box, Divider, Stack } from '@mui/material'
import { postAccessRequestComment, useGetAccessRequest } from 'actions/accessRequest'
import { postReleaseComment, useGetRelease } from 'actions/release'
import { useGetResponses } from 'actions/response'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { memoize } from 'lodash-es'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import RichTextEditor from 'src/common/RichTextEditor'
import MessageAlert from 'src/MessageAlert'
import ReviewCommentDisplay from 'src/reviews/ReviewCommentDisplay'
import ReviewDecisionDisplay from 'src/reviews/ReviewDecisionDisplay'
import { AccessRequestInterface, ReleaseInterface, ResponseInterface, ResponseKind } from 'types/types'
import { sortByCreatedAtAscending } from 'utils/arrayUtils'
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
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const ref = useRef<HTMLDivElement>(null)
  const { asPath } = useRouter()

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
  const { responses, isResponsesLoading, isResponsesError, mutateResponses } = useGetResponses([
    release ? release._id : accessRequest._id,
    ...reviews.map((review) => review._id),
  ])

  useEffect(() => {
    if (!isResponsesLoading && ref && asPath.split('#')[1] === 'responses') {
      ref.current?.scrollIntoView()
    }
  }, [asPath, isResponsesLoading, ref])

  const hasResponseOrComment = useMemo(() => {
    const hasReviewResponse = !!responses.find((response) => response.kind === ResponseKind.Review)
    const hasComment = !!responses.find((response) => response.kind === ResponseKind.Comment)
    return hasReviewResponse || hasComment
  }, [responses])

  const reviewDetails = useMemo(() => {
    let decisionsAndComments: Array<ResponseInterface> = []
    const groupedResponses = reviewResponsesForEachUser(
      reviews,
      responses.filter((response) => response.kind === ResponseKind.Review),
    )
    decisionsAndComments.push(...groupedResponses)
    if (release) {
      decisionsAndComments = [
        ...decisionsAndComments,
        ...responses.filter((response) => response.kind === ResponseKind.Comment),
      ]
    }
    if (accessRequest) {
      decisionsAndComments = [
        ...decisionsAndComments,
        ...responses.filter((response) => response.kind === ResponseKind.Comment),
      ]
    }
    return decisionsAndComments.sort(sortByCreatedAtAscending)
  }, [reviews, responses, release, accessRequest])

  const ResponseListItem = memoize(({ data, index }) => {
    if (data[index].kind === ResponseKind.Review) {
      return (
        <ReviewDecisionDisplay
          key={data[index]._id}
          response={data[index]}
          modelId={modelId}
          onReplyButtonClick={(quote) => setNewReviewComment(`${quote} \n\n ${newReviewComment}`)}
          currentUser={currentUser}
          mutateResponses={mutateResponses}
        />
      )
    } else {
      return (
        <ReviewCommentDisplay
          key={data[index]._id}
          response={data[index]}
          onReplyButtonClick={(quote) => setNewReviewComment(`${quote} \n\n ${newReviewComment}`)}
          currentUser={currentUser}
          mutateResponses={mutateResponses}
        />
      )
    }
  })

  async function submitReviewComment() {
    setCommentSubmissionError('')
    setSubmitButtonLoading(true)
    if (release) {
      const res = await postReleaseComment(modelId, release.semver, newReviewComment)
      if (res.ok) {
        mutateRelease()
        mutateResponses()
        setNewReviewComment('')
      } else {
        setCommentSubmissionError(await getErrorMessage(res))
      }
    } else if (accessRequest) {
      const res = await postAccessRequestComment(accessRequest.modelId, accessRequest.id, newReviewComment)
      if (res.ok) {
        mutateAccessRequest()
        mutateResponses()
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

  if (isResponsesError) {
    return <MessageAlert message={isResponsesError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <Stack spacing={2} ref={ref}>
      {(hasResponseOrComment || !isEdit) && <Divider />}
      {(isReviewsLoading || isResponsesLoading || isCurrentUserLoading) && <Loading />}
      <Paginate
        list={reviewDetails}
        emptyListText='No responses found'
        sortingProperties={[
          { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
          { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
        ]}
        defaultSortProperty='createdAt'
        hideSearchInput
        searchFilterProperty='comment'
      >
        {ResponseListItem}
      </Paginate>
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
    </Stack>
  )
}
