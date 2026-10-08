import CelebrationTwoTone from '@mui/icons-material/CelebrationTwoTone'
import Close from '@mui/icons-material/Close'
import Done from '@mui/icons-material/Done'
import FavoriteTwoTone from '@mui/icons-material/FavoriteTwoTone'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import ThumbDownTwoTone from '@mui/icons-material/ThumbDownTwoTone'
import ThumbUpTwoTone from '@mui/icons-material/ThumbUpTwoTone'
import {
  Box,
  Button,
  Chip,
  type ChipProps,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import type {
  DeploymentAssessmentCommentHistory,
  DeploymentAssessmentReaction,
  DeploymentAssessmentReviewHistory,
  DeploymentAssessmentReviewStatus,
} from 'actions/deploymentAssessments'
import { patchResponse, patchResponseReaction } from 'actions/response'
import { postDeploymentAssessmentReviewComment } from 'actions/review'
import { useGetCurrentUser } from 'actions/user'
import { type MouseEvent, type ReactNode, useMemo, useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import { Decision, ReactionKind, ReactionKindKeys } from 'types/types'
import { formatDateString, formatDateTimeString } from 'utils/dateUtils'
import { fromEntity } from 'utils/entityUtils'
import { getErrorMessage } from 'utils/fetcher'

type DeploymentAssessmentHistoryItem =
  | {
      kind: 'comment'
      item: DeploymentAssessmentCommentHistory
    }
  | {
      kind: 'review'
      item: DeploymentAssessmentReviewHistory
    }

type DeploymentAssessmentHistoryProps = {
  deploymentAssessmentId: string
  comments: DeploymentAssessmentCommentHistory[]
  reviews: DeploymentAssessmentReviewHistory[]
  statuses: DeploymentAssessmentReviewStatus[]
  isLoading: boolean
  errorMessage?: string
  isEdit: boolean
  mutateComments: () => void
  mutateReviews: () => void
}

type DeploymentAssessmentDecision = DeploymentAssessmentReviewStatus['status']

const decisionLabels: Record<DeploymentAssessmentDecision, string> = {
  [Decision.Approve]: 'Approved',
  [Decision.Reject]: 'Rejected',
  [Decision.RequestChanges]: 'Requested changes',
}

function getDecisionColour(decision: DeploymentAssessmentDecision): ChipProps['color'] {
  switch (decision) {
    case Decision.Approve:
      return 'success'
    case Decision.Reject:
      return 'error'
    case Decision.RequestChanges:
      return 'warning'
  }
}

function ReactionButton({
  kind,
  icon,
  reactions,
  onReactionClick,
}: {
  kind: ReactionKindKeys
  icon: ReactNode
  reactions: DeploymentAssessmentReaction[]
  onReactionClick: (kind: ReactionKindKeys) => void
}) {
  const reaction = reactions.find((item) => item.kind === kind)

  return (
    <Button size='small' onClick={() => onReactionClick(kind)} startIcon={icon}>
      {reaction?.users.length ?? 0}
    </Button>
  )
}

export default function DeploymentAssessmentHistory({
  deploymentAssessmentId,
  comments,
  reviews,
  statuses,
  isLoading,
  errorMessage,
  isEdit,
  mutateComments,
  mutateReviews,
}: DeploymentAssessmentHistoryProps) {
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()
  const [newComment, setNewComment] = useState('')
  const [submissionError, setSubmissionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string>()
  const [editedComment, setEditedComment] = useState('')
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [selectedItem, setSelectedItem] = useState<DeploymentAssessmentHistoryItem>()

  const history = useMemo<DeploymentAssessmentHistoryItem[]>(
    () =>
      [
        ...comments.map((item) => ({ kind: 'comment' as const, item })),
        ...reviews.map((item) => ({ kind: 'review' as const, item })),
      ].sort((first, second) => new Date(first.item.createdAt).getTime() - new Date(second.item.createdAt).getTime()),
    [comments, reviews],
  )

  function refreshHistory(kind: DeploymentAssessmentHistoryItem['kind']) {
    if (kind === 'comment') {
      mutateComments()
    } else {
      mutateReviews()
    }
  }

  function openActions(event: MouseEvent<HTMLElement>, historyItem: DeploymentAssessmentHistoryItem) {
    setMenuAnchor(event.currentTarget)
    setSelectedItem(historyItem)
  }

  function closeActions() {
    setMenuAnchor(null)
    setSelectedItem(undefined)
  }

  function startEditing(historyItem: DeploymentAssessmentHistoryItem) {
    closeActions()
    setEditingItemId(historyItem.item.id)
    setEditedComment(historyItem.item.comment ?? '')
  }

  function cancelEditing() {
    setEditingItemId(undefined)
    setEditedComment('')
  }

  async function saveEdit(historyItem: DeploymentAssessmentHistoryItem) {
    setSubmissionError('')
    const response = await patchResponse(historyItem.item.id, editedComment)
    if (!response.ok) {
      setSubmissionError(await getErrorMessage(response))
      return
    }

    refreshHistory(historyItem.kind)
    cancelEditing()
  }

  async function toggleReaction(historyItem: DeploymentAssessmentHistoryItem, kind: ReactionKindKeys) {
    setSubmissionError('')
    const response = await patchResponseReaction(historyItem.item.id, kind)
    if (!response.ok) {
      setSubmissionError(await getErrorMessage(response))
      return
    }

    refreshHistory(historyItem.kind)
  }

  function replyTo(historyItem: DeploymentAssessmentHistoryItem) {
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

  if (errorMessage) {
    return <MessageAlert message={errorMessage} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <Stack spacing={2}>
      {(isLoading || isCurrentUserLoading) && <Typography>Loading review history...</Typography>}
      {statuses.length > 0 && (
        <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap' }}>
          {statuses.map((status) => (
            <Chip
              key={status.role}
              label={`${status.role}: ${decisionLabels[status.status]}`}
              color={getDecisionColour(status.status)}
              size='small'
            />
          ))}
        </Stack>
      )}
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

          return (
            <Box key={historyItem.item.id} sx={{ borderRadius: 1, border: 1, borderColor: 'divider', p: 2 }}>
              <Stack direction='row' spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                  <UserDisplay dn={historyItem.item.entity} />
                  {historyItem.kind === 'comment' ? (
                    <Typography>has left a comment</Typography>
                  ) : (
                    <>
                      <Typography>{decisionLabels[historyItem.item.decision]}</Typography>
                      {historyItem.item.decision === Decision.Approve && <Done color='success' fontSize='small' />}
                      {historyItem.item.decision === Decision.Reject && <Close color='error' fontSize='small' />}
                      {historyItem.item.decision === Decision.RequestChanges && (
                        <HourglassEmpty color='warning' fontSize='small' />
                      )}
                      {historyItem.item.outdated && <Chip label='Outdated' color='warning' size='small' />}
                    </>
                  )}
                </Stack>
                <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 'bold' }}>{formatDateString(historyItem.item.createdAt)}</Typography>
                  <IconButton onClick={(event) => openActions(event, historyItem)} aria-label='Actions'>
                    <MoreHorizIcon />
                  </IconButton>
                </Stack>
              </Stack>
              <Divider sx={{ my: 1 }} />
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
                  <Stack direction='row' spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <ReactionButton
                      kind={ReactionKind.LIKE}
                      icon={<ThumbUpTwoTone fontSize='small' />}
                      reactions={historyItem.item.reactions}
                      onReactionClick={(kind) => toggleReaction(historyItem, kind)}
                    />
                    <ReactionButton
                      kind={ReactionKind.DISLIKE}
                      icon={<ThumbDownTwoTone fontSize='small' />}
                      reactions={historyItem.item.reactions}
                      onReactionClick={(kind) => toggleReaction(historyItem, kind)}
                    />
                    <ReactionButton
                      kind={ReactionKind.HEART}
                      icon={<FavoriteTwoTone fontSize='small' />}
                      reactions={historyItem.item.reactions}
                      onReactionClick={(kind) => toggleReaction(historyItem, kind)}
                    />
                    <ReactionButton
                      kind={ReactionKind.CELEBRATE}
                      icon={<CelebrationTwoTone fontSize='small' />}
                      reactions={historyItem.item.reactions}
                      onReactionClick={(kind) => toggleReaction(historyItem, kind)}
                    />
                  </Stack>
                  {historyItem.item.commentEditedAt && (
                    <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
                      Edited {formatDateTimeString(historyItem.item.commentEditedAt)}
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
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
