import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { Box, Card, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { patchResponse } from 'actions/response'
import { useGetUserInformation } from 'actions/user'
import { useCallback, useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import EditableReviewComment from 'src/reviews/EditableReviewComment'
import { EntityKind, ResponseInterface, User } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [comment, setComment] = useState(response.comment || '')
  const [errorMessage, setErrorMessage] = useState('')

  const [entityKind, username] = useMemo(() => response.entity.split(':'), [response.entity])

  const { userInformation, isUserInformationLoading, isUserInformationError } = useGetUserInformation(
    response.entity.split(':')[1],
  )

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

  if (isUserInformationLoading) {
    return <Loading />
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
          <Stack direction='row' spacing={1} alignItems='center' sx={{ width: '100%' }} justifyContent='space-between'>
            <Typography>
              <UserDisplay dn={username} />
              {' has left a comment'}
            </Typography>
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
            onCancel={handleEditOnCancel}
            onSave={handleEditOnSave}
            onReactionsError={handleReactionsError}
            mutateResponses={mutateResponses}
          />
          <MessageAlert message={errorMessage} severity='error' />
        </Card>
      </Stack>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleReplyOnClick(comment)}>Reply</MenuItem>
        {currentUser && currentUser.dn === username && <MenuItem onClick={handleEditOnClick}>Edit</MenuItem>}
      </Menu>
    </>
  )
}
