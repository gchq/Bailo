import { Menu as MenuIcon } from '@mui/icons-material'
import { Box, Button, Card, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { patchResponse } from 'actions/response'
import { useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import RichTextEditor from 'src/common/RichTextEditor'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import { EntityKind, ResponseInterface, User } from 'types/types'
import { formatDateString, formatDateTimeString } from 'utils/dateUtils'
import { getErrorMessage } from 'utils/fetcher'

type ReviewCommentDisplayProps = {
  response: ResponseInterface
  onReplyButtonClick: (value: string) => void
  currentUser: User | undefined
  mutateResponses: () => void
}

export default function ReviewCommentDisplay({
  response,
  onReplyButtonClick,
  currentUser,
  mutateResponses,
}: ReviewCommentDisplayProps) {
  const [entityKind, username] = response.entity.split(':')

  const theme = useTheme()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [updatedComment, setUpdatedComment] = useState('')
  const [editCommentErrorMessage, setEditCommentErrorMessage] = useState('')

  const open = Boolean(anchorEl)

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

  return (
    <>
      <Stack direction='row' spacing={2} alignItems='flex-start'>
        <Box mt={2}>
          <UserAvatar entity={{ kind: entityKind as EntityKind, id: username }} size='chip' />
        </Box>
        <Card
          sx={{
            width: '100%',
            p: 1,
          }}
        >
          {isEditMode}
          <Stack direction='row' spacing={1} alignItems='center' sx={{ width: '100%' }} justifyContent='space-between'>
            <Typography>
              <UserDisplay dn={username} />
              {' has left a comment'}
            </Typography>
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
