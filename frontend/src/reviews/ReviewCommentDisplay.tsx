import { Menu as MenuIcon } from '@mui/icons-material'
import { Box, Card, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import MessageAlert from 'src/MessageAlert'
import ReactionButtons from 'src/reviews/ReactionButtons'
import { EntityKind, ResponseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type ReviewCommentDisplayProps = {
  response: ResponseInterface
  onReplyButtonClick: (value: string) => void
  mutateResponses: () => void
}

export default function ReviewCommentDisplay({
  response,
  onReplyButtonClick,
  mutateResponses,
}: ReviewCommentDisplayProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const [entityKind, username] = useMemo(() => response.entity.split(':'), [response.entity])

  const handleReactionsError = useCallback((message: string) => {
    setErrorMessage(message)
  }, [])

  const handleReplyOnClick = (value: string | undefined) => {
    setAnchorEl(null)
    if (value) {
      onReplyButtonClick(value.replace(/^/gm, '>'))
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
          {response.comment && (
            <Box my={1}>
              <Divider sx={{ mb: 2 }} />
              <Box mx={1}>
                <MarkdownDisplay>{response.comment}</MarkdownDisplay>
              </Box>
            </Box>
          )}
          <ReactionButtons response={response} mutateResponses={mutateResponses} onError={handleReactionsError} />
          <MessageAlert message={errorMessage} severity='error' />
        </Card>
      </Stack>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleReplyOnClick(response.comment)}>Reply</MenuItem>
      </Menu>
    </>
  )
}
