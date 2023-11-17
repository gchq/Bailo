import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import UserAvatar from 'src/common/UserAvatar'
import EntityUtils from 'utils/entities/EntityUtils'

type ReviewCommentProps = {
  user: string
  comment: string
}

export default function ReviewComment({ user, comment }: ReviewCommentProps) {
  const theme = useTheme()
  const entityUtils = new EntityUtils()

  const username = entityUtils.formatDisplayName(user)

  return (
    <Stack direction='row' spacing={2} alignItems='center'>
      <UserAvatar entityDn={username} size='chip' />
      <Box
        sx={{
          border: 'solid',
          borderWidth: '1px',
          borderColor: theme.palette.primary.main,
          borderRadius: 2,
          width: '100%',
        }}
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
      </Box>
    </Stack>
  )
}
