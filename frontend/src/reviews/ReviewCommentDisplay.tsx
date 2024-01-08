import { Box, Card, Divider, Stack, Typography } from '@mui/material'
import UserAvatar from 'src/common/UserAvatar'
import { EntityKind, ReviewComment } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type ReviewCommentsProps = {
  response: ReviewComment
}

export default function ReviewComment({ response }: ReviewCommentsProps) {
  const username = response.user.split(':')[0]

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
        {response.comment && (
          <div>
            <Divider sx={{ my: 2 }} />
            <Typography>{response.comment}</Typography>
          </div>
        )}
      </Card>
    </Stack>
  )
}
