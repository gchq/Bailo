import { Undo } from '@mui/icons-material'
import { Menu as MenuIcon } from '@mui/icons-material'
import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Box, Button, Card, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetModelRoles } from 'actions/model'
import { patchResponse } from 'actions/response'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import { Decision, EntityKind, ResponseInterface, User } from 'types/types'
import { formatDateString, formatDateTimeString } from 'utils/dateUtils'
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
  const { modelRoles, isModelRolesLoading, isModelRolesError } = useGetModelRoles(modelId)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [updatedComment, setUpdatedComment] = useState('')
  const [editCommentErrorMessage, setEditCommentErrorMessage] = useState('')
  const open = Boolean(anchorEl)

  const theme = useTheme()
  const [entityKind, username] = response.entity.split(':')

  const handleReplyOnClick = (value: string | undefined) => {
    setAnchorEl(null)
    if (value) {
      onReplyButtonClick(value.replace(/^/gm, '>'))
    }
  }

  const handleEditOnClick = () => {
    setUpdatedComment(response.comment || '')
    setIsEditMode(true)
  }

  const handleEditOnSave = async () => {
    setEditCommentErrorMessage('')
    const res = await patchResponse(response['_id'], updatedComment)
    if (!res.ok) {
      setEditCommentErrorMessage(await getErrorMessage(res))
    } else {
      mutateResponses()
      setIsEditMode(false)
    }
  }

  if (isModelRolesError) {
    return <MessageAlert message={isModelRolesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelRolesLoading && <Loading />}
      <Stack direction='row' spacing={2} alignItems='flex-start'>
        <Box mt={1}>
          <UserAvatar entity={{ kind: entityKind as EntityKind, id: username }} size='chip' />
        </Box>
        <Card
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
            <Stack alignItems={{ xs: 'center', sm: 'flex-start' }} spacing={{ xs: 1, sm: 0 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems='center'>
                <Typography data-test='reviewDecisionDisplay'>
                  <UserDisplay dn={username} />
                  {response.decision === Decision.Approve && ' has approved'}
                  {response.decision === Decision.RequestChanges && ' has requested changes'}
                  {response.decision === Decision.Undo && ' has undone their review'}
                </Typography>
                {response.decision === Decision.Approve && <Done color='success' fontSize='small' />}
                {response.decision === Decision.RequestChanges && <HourglassEmpty color='warning' fontSize='small' />}
                {response.decision === Decision.Undo && <Undo fontSize='small' />}
                {response.outdated && (
                  <Typography sx={{ backgroundColor: theme.palette.warning.light, borderRadius: 1, px: 0.5 }}>
                    Outdated
                  </Typography>
                )}
              </Stack>
              {response.role && (
                <Typography variant='caption'>as {getRoleDisplay(response.role, modelRoles)}</Typography>
              )}
            </Stack>
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography fontWeight='bold'>{formatDateString(response.createdAt)}</Typography>
              <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
                <MenuIcon />
              </IconButton>
            </Stack>
          </Stack>
          <Divider sx={{ mt: 1, mb: 2 }} />
          {response.comment && !isEditMode && (
            <Stack spacing={2}>
              <MarkdownDisplay>{response.comment}</MarkdownDisplay>
              {response.updatedAt !== response.createdAt && (
                <Typography variant='caption' sx={{ fontStyle: 'italic' }}>
                  Updated {formatDateTimeString(response.updatedAt)}
                </Typography>
              )}
            </Stack>
          )}
          {isEditMode && (
            <>
              <RichTextEditor value={updatedComment} onChange={(input) => setUpdatedComment(input)} />
              <Box sx={{ float: 'right' }}>
                <Button onClick={handleEditOnSave}>Save</Button>
              </Box>
              <Typography variant='caption' color={theme.palette.error.main}>
                {editCommentErrorMessage}
              </Typography>
            </>
          )}
        </Card>
      </Stack>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleReplyOnClick(response.comment)}>Reply</MenuItem>
        {currentUser && currentUser.dn === username && <MenuItem onClick={handleEditOnClick}>Edit comment</MenuItem>}
      </Menu>
    </>
  )
}
