import { Box, Button, Stack } from '@mui/material'
import { postDeploymentAssessmentComment } from 'actions/deploymentAssessment'
import { useGetCurrentUser } from 'actions/user'
import { useMemo, useState } from 'react'
import Paginate from 'src/common/Paginate'
import renderQueryState from 'src/common/renderQueryState'
import RichTextEditor from 'src/common/RichTextEditor'
import MessageAlert from 'src/MessageAlert'
import ReviewCommentDisplay from 'src/reviews/ReviewCommentDisplay'
import { ResponseInterface, ResponseKind } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface DeploymentAssessmentCommentsProps {
  deploymentAssessmentId: string
  responses: ResponseInterface[]
  isEdit: boolean
  mutateResponses: () => void
}

export default function DeploymentAssessmentComments({
  deploymentAssessmentId,
  responses,
  isEdit,
  mutateResponses,
}: DeploymentAssessmentCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)

  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const comments = useMemo(() => responses.filter((response) => response.kind === ResponseKind.Comment), [responses])

  async function handleSubmitComment() {
    setErrorMessage('')
    setIsSubmitLoading(true)
    const res = await postDeploymentAssessmentComment(deploymentAssessmentId, newComment)
    if (res.ok) {
      setNewComment('')
      mutateResponses()
    } else {
      setErrorMessage(await getErrorMessage(res))
    }
    setIsSubmitLoading(false)
  }

  const queryState = renderQueryState([isCurrentUserError], isCurrentUserLoading)
  if (queryState) {
    return queryState
  }

  return (
    <Stack spacing={2} data-test='deploymentAssessmentComments'>
      {!isEdit && (
        <Stack spacing={1} sx={{ justifyContent: 'center', alignItems: 'flex-end', px: 2 }}>
          <Box sx={{ width: '100%' }}>
            <RichTextEditor
              value={newComment}
              onChange={(value) => setNewComment(value)}
              textareaProps={{ placeholder: 'Add your comment here...' }}
            />
          </Box>
          <Button
            sx={{ mt: 1 }}
            variant='contained'
            onClick={handleSubmitComment}
            loading={isSubmitLoading}
            disabled={!newComment}
            data-test='addDeploymentAssessmentCommentButton'
          >
            Add comment
          </Button>
          <MessageAlert severity='error' message={errorMessage} />
        </Stack>
      )}
      <Paginate
        list={comments}
        emptyListText='No comments found'
        sortingProperties={[
          { value: 'createdAt', title: 'Date uploaded', iconKind: 'date' },
          { value: 'updatedAt', title: 'Date updated', iconKind: 'date' },
        ]}
        defaultSortProperty='createdAt'
        hideSearchInput
        searchFilterProperty='createdAt'
      >
        {({ data }) => (
          <ReviewCommentDisplay
            key={data._id}
            response={data}
            onReplyButtonClick={(quote) => setNewComment(`${quote} \n\n ${newComment}`)}
            currentUser={currentUser}
            mutateResponses={mutateResponses}
          />
        )}
      </Paginate>
    </Stack>
  )
}
