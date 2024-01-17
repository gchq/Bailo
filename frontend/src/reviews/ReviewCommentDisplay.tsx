import { Box, Card, Divider, Stack, Typography } from '@mui/material'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import UserAvatar from 'src/common/UserAvatar'
import { EntityKind, ReviewComment } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type ReviewCommentsProps = {
  response: ReviewComment
}

export default function ReviewComment({ response }: ReviewCommentsProps) {
  const username = response.user

  return (
    <Stack direction='row' spacing={2} alignItems='center'>
      <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />{' '}
      <Card
        sx={{
          width: '100%',
          p: 1,
        }}
      >
        <Stack direction='row' spacing={1} alignItems='center' sx={{ width: '100%' }} justifyContent='space-between'>
          <Typography>
            <Box component='span' fontWeight='bold'>
              {username}
            </Box>
            {' has left a comment'}
          </Typography>
          <Typography fontWeight='bold'>{formatDateString(response.createdAt)}</Typography>
        </Stack>
        {response.message && (
          <div>
            <Divider sx={{ my: 2 }} />
            <MarkdownDisplay>{response.message}</MarkdownDisplay>
          </div>
        )}
      </Card>
    </Stack>
  )
}
