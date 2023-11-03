import Done from '@mui/icons-material/Done'
import HourglassEmpty from '@mui/icons-material/HourglassEmpty'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetReviewRequestsForModel } from 'actions/review'
import Loading from 'src/common/Loading'
import UserAvatar from 'src/common/UserAvatar'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import { AccessRequestInterface } from 'types/interfaces'
import { EntityKind } from 'types/types'

interface ReviewCommentsProps {
  accessRequest: AccessRequestInterface
}

export default function ReviewComments({ accessRequest }: ReviewCommentsProps) {
  const theme = useTheme()
  const {
    reviews: inactiveReviews,
    isReviewsLoading: isInactiveReviewsLoading,
    isReviewsError: isInactiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId: accessRequest.modelId,
    accessRequestId: accessRequest.id,
    isActive: false,
  })

  function getDecision(user: string, reviewDecision: string) {
    const username = user.split(':')[0]
    switch (reviewDecision) {
      case 'approved':
        return (
          <Stack direction='row' spacing={2} alignItems='center'>
            <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />{' '}
            <Box
              sx={{
                border: 'solid',
                borderWidth: '1px',
                borderColor: theme.palette.primary.main,
                borderRadius: 2,
                p: 1,
                width: '100%',
              }}
            >
              <Stack direction='row' spacing={1} alignItems='center'>
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>{username}</span> has marked this as approved.
                </Typography>
                <Done color='success' fontSize='small' />
              </Stack>
            </Box>
          </Stack>
        )
      case 'request_changes':
        return (
          <Stack direction='row' spacing={2} alignItems='center'>
            <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />
            <Box
              sx={{
                border: 'solid',
                borderWidth: '1px',
                borderColor: theme.palette.primary.main,
                borderRadius: 2,
                p: 1,
                width: '100%',
              }}
            >
              <Stack direction='row' spacing={1} alignItems='center'>
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>{username}</span> has requested changes.
                </Typography>
                <HourglassEmpty color='warning' fontSize='small' />
              </Stack>
            </Box>
          </Stack>
        )
    }
  }

  function getComment(user: string, reviewComment: string | undefined) {
    if (reviewComment) {
      const username = user.split(':')[0]
      return (
        <Stack direction='row' spacing={2} alignItems='center'>
          <UserAvatar entity={{ kind: EntityKind.USER, id: username }} size='chip' />
          <Box
            sx={{
              border: 'solid',
              borderWidth: '1px',
              borderColor: theme.palette.primary.main,
              borderRadius: 2,
              width: '100%',
            }}
          >
            <Stack spacing={1}>
              <Box
                sx={{
                  backgroundColor: theme.palette.container.main,
                  borderRadius: '8px 8px 0px 0px',
                  p: 1,
                }}
              >
                <Typography>
                  <span style={{ fontWeight: 'bold' }}>{username}</span> has left the following comment
                </Typography>
              </Box>
              <Typography sx={{ p: 1 }}>{reviewComment}</Typography>
            </Stack>
          </Box>
        </Stack>
      )
    }
  }

  const error = MultipleErrorWrapper('Unable to load review responses', {
    isInactiveReviewsError,
  })
  if (error) return error
  return (
    <>
      {isInactiveReviewsLoading && <Loading />}
      {inactiveReviews && <Divider />}
      {inactiveReviews.map((inactiveReview) => {
        return inactiveReview.responses.map((response) => (
          <>
            {getDecision(response.user, response.decision)}
            {getComment(response.user, response.comment)}
          </>
        ))
      })}
    </>
  )
}
