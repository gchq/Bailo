import Close from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { Box, Button, Chip, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import type {
  DeploymentAssessmentCommentHistory,
  DeploymentAssessmentReviewHistory,
} from 'actions/deploymentAssessments'
import { patchResponse } from 'actions/response'
import { postDeploymentAssessmentReviewComment } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { type MouseEvent, useMemo, useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import ReactionButtons from 'src/reviews/ReactionButtons'
import { Decision, EntityKind } from 'types/types'
import { formatDateString, formatDateTimeString } from 'utils/dateUtils'
import { fromEntity } from 'utils/entityUtils'
import { getErrorMessage } from 'utils/fetcher'

type DeploymentAssessmentReviewHistoryItem =
  | {
      kind: 'comment'
      item: DeploymentAssessmentCommentHistory
    }
  | {
      kind: 'review'
      item: DeploymentAssessmentReviewHistory
    }

type DeploymentAssessmentReviewHistoryProps = {
  deploymentAssessmentId: string
  comments: DeploymentAssessmentCommentHistory[]
  reviews: DeploymentAssessmentReviewHistory[]
  isLoading: boolean
  isEdit: boolean
  mutateComments: () => void
  mutateReviews: () => void
}

export default function DeploymentAssessmentReviewHistory({
  deploymentAssessmentId,
  comments,
  reviews,
  isLoading,
  isEdit,
  mutateComments,
  mutateReviews,
}: DeploymentAssessmentReviewHistoryProps) {
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const [newComment, setNewComment] = useState('')
  const [submissionError, setSubmissionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string>()
  const [editedComment, setEditedComment] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [selectedItem, setSelectedItem] = useState<DeploymentAssessmentReviewHistoryItem>()

  const history = useMemo<DeploymentAssessmentReviewHistoryItem[]>(
    () =>
      [
        ...comments.map((item) => ({ kind: 'comment' as const, item })),
        ...reviews.map((item) => ({ kind: 'review' as const, item })),
      ].sort((first, second) => new Date(first.item.createdAt).getTime() - new Date(second.item.createdAt).getTime()),
    [comments, reviews],
  )

  function refreshHistory(kind: DeploymentAssessmentReviewHistoryItem['kind']) {
    if (kind === 'comment') {
      mutateComments()
    } else {
      mutateReviews()
    }
  }

  function openActions(event: MouseEvent<HTMLElement>, historyItem: DeploymentAssessmentReviewHistoryItem) {
    setMenuAnchor(event.currentTarget)
    setSelectedItem(historyItem)
  }

  function closeActions() {
    setMenuAnchor(null)
    setSelectedItem(undefined)
  }

  function startEditing(historyItem: DeploymentAssessmentReviewHistoryItem) {
    closeActions()
    setEditingItemId(historyItem.item.id)
    setEditedComment(historyItem.item.comment ?? '')
  }

  function cancelEditing() {
    setEditingItemId(undefined)
    setEditedComment('')
  }

  async function saveEdit(historyItem: DeploymentAssessmentReviewHistoryItem) {
    setSubmissionError('')
    const response = await patchResponse(historyItem.item.id, editedComment)
    if (!response.ok) {
      setSubmissionError(await getErrorMessage(response))
      return
    }

    refreshHistory(historyItem.kind)
    cancelEditing()
  }

  function replyTo(historyItem: DeploymentAssessmentReviewHistoryItem) {
    closeActions()
    const { id: userDn } = fromEntity(historyItem.item.entity)
    const quote = `> Replying to **${userDn}** on **${formatDateString(historyItem.item.createdAt)}**\n>\n${(
      historyItem.item.comment ?? ''
    ).replace(/^/gm, '>')}`
    setNewComment(`${quote}\n\n${newComment}`)
  }

  async function submitComment() {
    setSubmissionError('')
    setIsSubmitting(true)
    const response = await postDeploymentAssessmentReviewComment(deploymentAssessmentId, newComment)
    if (!response.ok) {
      setSubmissionError(await getErrorMessage(response))
    } else {
      setNewComment('')
      mutateComments()
    }
    setIsSubmitting(false)
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <Stack spacing={2}>
      {(isLoading || isCurrentUserLoading) && <Typography>Loading review history...</Typography>}
      {!isEdit && (
        <Stack spacing={1} sx={{ alignItems: 'flex-end', px: 2 }}>
          <Box sx={{ width: '100%' }}>
            <RichTextEditor
              value={newComment}
              onChange={setNewComment}
              textareaProps={{ placeholder: 'Add your comment here...' }}
            />
          </Box>
          <Button variant='contained' onClick={submitComment} loading={isSubmitting} disabled={!newComment}>
            Add comment
          </Button>
        </Stack>
      )}
      {history.length === 0 && !isLoading && <Typography>No responses found</Typography>}
      <Stack spacing={1}>
        {history.map((historyItem) => {
          const isEditing = editingItemId === historyItem.item.id
          const entity = fromEntity(historyItem.item.entity)

          return (
            <Stack key={historyItem.item.id} direction='row' spacing={0.5} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ pt: 2.5, pl: 2 }}>
                <UserAvatar entity={{ kind: entity.kind as EntityKind, id: entity.id }} />
              </Box>
              <Box sx={{ width: '100%', p: 1 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5} sx={{ alignItems: 'center' }}>
                    <UserDisplay dn={entity.id} />
                    {historyItem.kind === 'comment' ? (
                      <Typography>has left a comment</Typography>
                    ) : (
                      <>
                        <Typography>{historyItem.item.decision === Decision.Approve && 'has approved'}</Typography>
                        <Typography>
                          {historyItem.item.decision === Decision.RequestChanges && 'has requested changes'}
                        </Typography>
                        <Typography>{historyItem.item.decision === Decision.Reject && 'has rejected'}</Typography>
                        {historyItem.item.decision === Decision.Approve && <Done color='success' fontSize='small' />}
                        {historyItem.item.decision === Decision.RequestChanges && (
                          <HourglassEmpty color='warning' fontSize='small' />
                        )}
                        {historyItem.item.decision === Decision.Reject && <Close color='error' fontSize='small' />}
                        {historyItem.item.outdated && <Chip label='Outdated' color='warning' size='small' />}
                      </>
                    )}
                  </Stack>
                  <Stack direction='row' spacing={1} sx={{ alignItems: 'center', ml: { sm: 'auto' } }}>
                    <Typography sx={{ fontWeight: 'bold' }}>{formatDateString(historyItem.item.createdAt)}</Typography>
                    <IconButton onClick={(event) => openActions(event, historyItem)} aria-label='Actions'>
                      <MoreHorizIcon />
                    </IconButton>
                  </Stack>
                </Stack>
                <Divider sx={{ mb: 1 }} />
                {isEditing ? (
                  <Stack spacing={1}>
                    <RichTextEditor value={editedComment} onChange={setEditedComment} />
                    <Stack direction='row' spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button onClick={cancelEditing}>Cancel</Button>
                      <Button variant='contained' onClick={() => saveEdit(historyItem)}>
                        Save
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={1}>
                    <MarkdownDisplay>{historyItem.item.comment ?? ''}</MarkdownDisplay>
                    <ReactionButtons
                      response={{ _id: historyItem.item.id, reactions: historyItem.item.reactions }}
                      mutateResponses={() => refreshHistory(historyItem.kind)}
                      onError={setSubmissionError}
                    />
                    {historyItem.item.commentEditedAt && (
                      <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
                        Edited {formatDateTimeString(historyItem.item.commentEditedAt)}
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
            </Stack>
          )
        })}
      </Stack>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeActions}>
        {selectedItem && <MenuItem onClick={() => replyTo(selectedItem)}>Reply</MenuItem>}
        {selectedItem && currentUser?.dn === fromEntity(selectedItem.item.entity).id && (
          <MenuItem onClick={() => startEditing(selectedItem)}>Edit</MenuItem>
        )}
      </Menu>
      <MessageAlert message={submissionError} severity='error' />
    </Stack>
  )
}
