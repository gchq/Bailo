import { Box, Card, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetIdentity } from 'actions/user'
import Loading from 'src/common/Loading'
import UserAvatar from 'src/common/UserAvatar'
import MessageAlert from 'src/MessageAlert'

type ReviewCommentProps = {
  user: string
  comment: string
}

export default function ReviewComment({ user, comment }: ReviewCommentProps) {
  const theme = useTheme()
  const { entity, isEntityLoading, isEntityError } = useGetIdentity(user || '')

  if (isEntityError) {
    return <MessageAlert message={isEntityError.info.message} severity='error' />
  }

  return (
    <>
      {isEntityLoading && <Loading />}
      <Stack direction='row' spacing={2} alignItems='center'>
        <UserAvatar entityDn={entity} size='chip' />
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
    </>
  )
}
