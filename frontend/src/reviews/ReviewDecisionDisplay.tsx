import { ErrorOutline, Undo } from '@mui/icons-material'
import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { Box, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetModelRoles } from 'actions/model'
import { patchResponse } from 'actions/response'
import { useGetUserInformation } from 'actions/user'
import { useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import EditableReviewComment from 'src/reviews/EditableReviewComment'
import { Decision, EntityKind, ResponseInterface, User } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'
import { getRoleDisplay } from 'utils/roles'

type ReviewDecisionDisplayProps = {
  response: ResponseInterface
  modelId: string
  onReplyButtonClick: (value: string) => void
  currentUser: User | undefined
  mutateResponses: () => void
}

export default function ReviewDecisionDisplay({
  response,
  modelId,
  onReplyButtonClick,
  currentUser,
  mutateResponses,
}: ReviewDecisionDisplayProps) {
  const theme = useTheme()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [comment, setComment] = useState(response.comment || '')
  const [errorMessage, setErrorMessage] = useState('')

  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)
  const { userInformation, isUserInformationLoading, isUserInformationError } = useGetUserInformation(
    response.entity.split(':')[1],
  )

  const [entityKind, username] = useMemo(() => response.entity.split(':'), [response.entity])

  const handleReactionsError = useCallback((message: string) => {
    setErrorMessage(message)
  }, [])

  const handleReplyOnClick = (value: string | undefined) => {
    setAnchorEl(null)
    if (value) {
      const username = userInformation ? userInformation.name : response.entity.split(':')[1]
      const originalComment = value.replace(/^/gm, '>')
      const quote = `> Replying to **${username}** on **${formatDateString(response.createdAt)}** \n>\n${originalComment}`
      onReplyButtonClick(quote)
    }
  }

  const handleEditOnClick = () => {
    setAnchorEl(null)
    setIsEditMode(true)
  }

  const handleEditOnCancel = () => {
    setIsEditMode(false)
    setErrorMessage('')
    setComment(response.comment || '')
  }

  const handleEditOnSave = async () => {
    setErrorMessage('')
    const res = await patchResponse(response._id, comment)
    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
      mutateResponses()
      setIsEditMode(false)
    }
  }

  if (isUserInformationError) {
    return <MessageAlert message={isUserInformationError.info.message} severity='error' />
  }

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  if (isUserInformationLoading) {
    return <Loading />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      <Stack direction='row' spacing={2} alignItems='flex-start'>
        <Box sx={{ pt: 2, pl: 2 }}>
          <UserAvatar entity={{ kind: entityKind as EntityKind, id: username }} />
        </Box>
        <Box
          sx={{
            width: '100%',
            p: 1,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems='center'
            sx={{ width: '100%' }}
            justifyContent='space-between'
          >
            <Stack alignItems='center' direction='row' sx={{ width: '100%' }} spacing={1}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems='center'>
                <UserDisplay dn={username} />
                <span data-test='reviewDecisionDisplayApproved'>
                  {response.decision === Decision.Approve && 'has approved'}
                </span>
                <span data-test='reviewDecisionDisplayDenied'>
                  {response.decision === Decision.Deny && 'has denied'}
                </span>
                <span data-test='reviewDecisionDisplayRequestChanges'>
                  {response.decision === Decision.RequestChanges && 'has requested changes'}
                </span>
                <span>{response.decision === Decision.Undo && 'has undone their review'}</span>
                <span>{response.decision === Decision.Approve && <Done color='success' fontSize='small' />}</span>
                <span>{response.decision === Decision.Deny && <ErrorOutline color='error' fontSize='small' />}</span>
                <span>
                  {response.decision === Decision.RequestChanges && <HourglassEmpty color='warning' fontSize='small' />}
                </span>
                <span>{response.decision === Decision.Undo && <Undo fontSize='small' />}</span>
              </Stack>
              {response.role && (
                <Typography variant='caption'>as {getRoleDisplay(response.role, modelRoles)}</Typography>
              )}
              <span>
                {response.outdated && (
                  <Typography sx={{ backgroundColor: theme.palette.warning.light, borderRadius: 1, px: 0.5 }}>
                    Outdated
                  </Typography>
                )}
              </span>
            </Stack>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography fontWeight='bold'>{formatDateString(response.createdAt)}</Typography>
              <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} aria-label='Actions'>
                <MoreHorizIcon />
              </IconButton>
            </Stack>
          </Stack>
          <Divider sx={{ mt: 1, mb: 2 }} />
          <EditableReviewComment
            comment={comment}
            onCommentChange={setComment}
            response={response}
            isEditMode={isEditMode}
            onSave={handleEditOnSave}
            onCancel={handleEditOnCancel}
            onReactionsError={handleReactionsError}
            mutateResponses={mutateResponses}
          />
          <MessageAlert message={errorMessage} severity='error' />
        </Box>
      </Stack>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleReplyOnClick(comment)}>Reply</MenuItem>
        {currentUser && currentUser.dn === username && <MenuItem onClick={handleEditOnClick}>Edit comment</MenuItem>}
      </Menu>
    </>
  )
}
