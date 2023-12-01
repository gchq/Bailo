import { Box, Card, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import UserAvatar from 'src/common/UserAvatar'
import { EntityKind } from 'types/types'

type ReviewCommentProps = {
  user: string
  comment: string
}

export default function ReviewComment({ user, comment }: ReviewCommentProps) {
  const theme = useTheme()

  const username = user.split(':')[0]

  return (
    <Stack direction='row' spacing={2} alignItems='center'>
      <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />
      <Card
        sx={{
          width: '100%',
        }}
        variant='outlined'
      >
        <Box
          sx={{
            color: theme.palette.primary.contrastText,
            backgroundColor: theme.palette.primary.main,
            borderRadius: '4px 4px 0px 0px',
            px: 1,
            py: 0.5,
          }}
        >
          <Typography>
            <Box component='span' fontWeight='bold'>
              {username}
            </Box>
            {' added a comment'}
          </Typography>
        </Box>
        <Typography sx={{ px: 1, py: 0.5 }}>{comment}</Typography>
      </Card>
    </Stack>
  )
}
