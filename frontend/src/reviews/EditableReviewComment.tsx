import Close from '@mui/icons-material/Close'
import Save from '@mui/icons-material/Save'
import { Button, Stack, Typography } from '@mui/material'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import ReactionButtons from 'src/reviews/ReactionButtons'
import { ResponseInterface } from 'types/types'
import { formatDateTimeString } from 'utils/dateUtils'

interface EditableReviewCommentProps {
  comment: string
  onCommentChange: (value: string) => void
  response: ResponseInterface
  isEditMode: boolean
  onCancel: () => void
  onSave: () => void
  onReactionsError: (message: string) => void
  mutateResponses: () => void
}

export default function EditableReviewComment({
  comment,
  onCommentChange,
  response,
  isEditMode,
  onCancel,
  onSave,
  onReactionsError,
  mutateResponses,
}: EditableReviewCommentProps) {
  return (
    <>
      {!isEditMode && (
        <Stack spacing={2}>
          <MarkdownDisplay>{comment}</MarkdownDisplay>
          <ReactionButtons response={response} mutateResponses={mutateResponses} onError={onReactionsError} />
          {response.commentEditedAt && (
            <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
              Edited {formatDateTimeString(response.commentEditedAt)}
            </Typography>
          )}
        </Stack>
      )}
      {isEditMode && (
        <>
          <RichTextEditor value={comment} onChange={onCommentChange} />
          <Stack
            direction='row'
            spacing={1}
            sx={{
              justifyContent: 'right',
              textAlign: 'right',
              pt: 2,
            }}
          >
            <Button onClick={onCancel} startIcon={<Close />}>
              Cancel
            </Button>
            <Button variant='contained' onClick={onSave} startIcon={<Save />}>
              Save
            </Button>
          </Stack>
        </>
      )}
    </>
  )
}
