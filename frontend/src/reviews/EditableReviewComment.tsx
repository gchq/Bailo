import { Button, Stack, Typography } from '@mui/material'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import MessageAlert from 'src/MessageAlert'
import { ResponseInterface } from 'types/types'
import { formatDateTimeString } from 'utils/dateUtils'

interface EditableReviewCommentProps {
  comment: string
  setComment: (value: string) => void
  response: ResponseInterface
  isEditMode: boolean
  setIsEditMode: (value: boolean) => void
  editCommentErrorMessage: string
  onSave: () => void
}

export default function EditableReviewComment({
  comment,
  setComment,
  response,
  isEditMode,
  setIsEditMode,
  editCommentErrorMessage,
  onSave,
}: EditableReviewCommentProps) {
  return (
    <>
      {comment && !isEditMode && (
        <Stack spacing={2}>
          <MarkdownDisplay>{comment}</MarkdownDisplay>
          {response.updatedAt !== response.createdAt && (
            <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
              Edited {formatDateTimeString(response.updatedAt)}
            </Typography>
          )}
        </Stack>
      )}
      {isEditMode && (
        <>
          <RichTextEditor value={comment} onChange={(input) => setComment(input)} />
          <Stack sx={{ textAlign: 'right', pt: 2 }} direction='row' spacing={1} justifyContent='right'>
            <Button onClick={() => setIsEditMode(false)}>Cancel</Button>
            <Button variant='contained' onClick={onSave}>
              Save
            </Button>
          </Stack>
          <MessageAlert message={editCommentErrorMessage} />
        </>
      )}
    </>
  )
}
