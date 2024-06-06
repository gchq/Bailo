import { Menu as MenuIcon } from '@mui/icons-material'
import { Card, Divider, IconButton, Menu, MenuItem, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import UserAvatar from 'src/common/UserAvatar'
import UserDisplay from 'src/common/UserDisplay'
import { EntityKind, ResponseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type ReviewCommentDisplayProps = {
  response: ResponseInterface
  onReplyButtonClick: (value: string) => void
}

export default function ReviewCommentDisplay({ response, onReplyButtonClick }: ReviewCommentDisplayProps) {
  const [entityKind, username] = response.user.split(':')

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleReplyOnClick = (value: string | undefined) => {
    setAnchorEl(null)
    if (value) {
      onReplyButtonClick(value.replace(/^/gm, '>'))
    }
  }

  return (
    <>
      <Stack direction='row' spacing={2} alignItems='flex-start'>
        <div style={{ marginTop: 5 }}>
          <UserAvatar entity={{ kind: entityKind as EntityKind, id: username }} size='chip' />
        </div>
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
            <div>
              <Divider sx={{ mt: 1, mb: 2 }} />
              <MarkdownDisplay>{response.comment}</MarkdownDisplay>
            </div>
          )}
        </Card>
      </Stack>
      <Menu
        id='basic-menu'
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={() => handleReplyOnClick(response.comment)}>Reply</MenuItem>
      </Menu>
    </>
  )
}
