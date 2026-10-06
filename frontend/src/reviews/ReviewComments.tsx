import { Box, Button, Stack } from '@mui/material'
import { postAccessRequestComment } from 'actions/accessRequest'
import { postReleaseComment } from 'actions/release'
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
import { ResponseInterface, ResponseKind, ReviewKind, ReviewKindKeys } from 'types/types'
import { sortByCreatedAtAscending } from 'utils/arrayUtils'
import { getErrorMessage } from 'utils/fetcher'
import { reviewResponsesForEachUser } from 'utils/reviewUtils'

interface ReviewCommentsProps {
  isEdit: boolean
  // The identifier is used for specific releases and access requests
  identifier?: string
  parentId: string
  entryId: string
  kind: ReviewKindKeys
  mutator: () => void
  showComments?: boolean
}

export default function ReviewComments({
  identifier,
  entryId,
  isEdit,
  mutator,
  kind,
  parentId,
  showComments = true,
}: ReviewCommentsProps) {
  const [newReviewComment, setNewReviewComment] = useState('')
  const [commentSubmissionError, setCommentSubmissionError] = useState('')
  const [submitButtonLoading, setSubmitButtonLoading] = useState(false)

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const ref = useRef<HTMLDivElement>(null)
  const { asPath } = useRouter()

  function getIdentifierFromKind() {
    switch (kind) {
      case ReviewKind.RELEASE:
        if (!identifier) {
          return {}
        }
        return { semver: identifier }
      case ReviewKind.ACCESS:
        if (!identifier) {
          return {}
        }
        return { accessRequestId: identifier }
      default:
        return {}
    }
  }

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: entryId,
    kind,
    ...getIdentifierFromKind(),
  })
  const { responses, isResponsesLoading, isResponsesError, mutateResponses } = useGetResponses([
    parentId,
    ...reviews.map((review) => review._id),
  ])

  useEffect(() => {
    if (!isResponsesLoading && ref && asPath.split('#')[1] === 'responses') {
      ref.current?.scrollIntoView()
    }
  }, [asPath, isResponsesLoading, ref])

  const reviewDetails = useMemo(() => {
    let decisionsAndComments: Array<ResponseInterface> = []
    const groupedResponses = reviewResponsesForEachUser(
      reviews,
      responses.filter((response) => response.kind === ResponseKind.Review),
    )
    decisionsAndComments.push(...groupedResponses)
    if (showComments) {
      decisionsAndComments = [
        ...decisionsAndComments,
        ...responses.filter((response) => response.kind === ResponseKind.Comment),
      ]
    }
    return decisionsAndComments.sort(sortByCreatedAtAscending)
  }, [reviews, responses, showComments])

  const ResponseListItem = memoize(({ data }) => {
    if (data.kind === ResponseKind.Review) {
      return (
        <ReviewDecisionDisplay
          key={data._id}
          response={data}
          modelId={entryId}
          onReplyButtonClick={(quote) => setNewReviewComment(`${quote} \n\n ${newReviewComment}`)}
          showReplyButton={showComments}
          currentUser={currentUser}
          mutateResponses={mutateResponses}
        />
      )
    } else {
      return (
        <ReviewCommentDisplay
          key={data._id}
          response={data}
          onReplyButtonClick={(quote) => setNewReviewComment(`${quote} \n\n ${newReviewComment}`)}
          showReplyButton={showComments}
          currentUser={currentUser}
          mutateResponses={mutateResponses}
        />
      )
    }
  })

  async function submitReviewComment() {
    setCommentSubmissionError('')
    setSubmitButtonLoading(true)
    if (kind === ReviewKind.RELEASE && identifier) {
      const res = await postReleaseComment(entryId, identifier, newReviewComment)
      if (res.ok) {
        mutator()
        mutateResponses()
        setNewReviewComment('')
      } else {
        setCommentSubmissionError(await getErrorMessage(res))
      }
    } else if (kind === ReviewKind.ACCESS && identifier) {
      const res = await postAccessRequestComment(entryId, identifier, newReviewComment)
      if (res.ok) {
        mutator()
        mutateResponses()
        setNewReviewComment('')
      } else {
        setCommentSubmissionError(await getErrorMessage(res))
      }
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
        searchFilterProperty='createdAt'
      >
        {ResponseListItem}
      </Paginate>
      {!isEdit && showComments && (
        <Stack spacing={1} sx={{ justifyContent: 'center', alignItems: 'flex-end' }}>
          <Box sx={{ width: '100%' }}>
            <RichTextEditor
              value={newReviewComment}
              onChange={(e) => setNewReviewComment(e)}
              textareaProps={{ placeholder: 'Add your comment here...' }}
            />
          </Box>
          <Button
            sx={{ mt: 1 }}
            variant='contained'
            onClick={submitReviewComment}
            loading={submitButtonLoading}
            disabled={!newReviewComment}
          >
            Add comment
          </Button>
          <MessageAlert severity='error' message={commentSubmissionError} />
        </Stack>
      )}
    </Stack>
  )
}
