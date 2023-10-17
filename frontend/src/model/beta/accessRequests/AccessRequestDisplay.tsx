import { Box, Button, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { AccessRequestInterface } from 'types/interfaces'
import { formatDateString } from 'utils/dateUtils'

import { useGetReviewRequestsForModel } from '../../../../actions/review'
import Loading from '../../../common/Loading'
import MessageAlert from '../../../MessageAlert'
import ReviewBanner from '../reviews/ReviewBanner'
import ReviewDisplay from '../reviews/ReviewDisplay'

type AccessRequestDisplayProps = {
  accessRequest: AccessRequestInterface
}

export default function AccessRequestDisplay({ accessRequest }: AccessRequestDisplayProps) {
  const theme = useTheme()
  const router = useRouter()

  // TODO me - get access request reviews (both active and inactive)
  const {
    reviews: activeReviews,
    isReviewsLoading: isActiveReviewsLoading,
    isReviewsError: isActiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId: accessRequest.modelId,
    accessRequestId: accessRequest.id,
    isActive: true,
    reviewKind: 'access',
  })
  const {
    reviews: inactiveReviews,
    isReviewsLoading: isInactiveReviewsLoading,
    isReviewsError: isInactiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId: accessRequest.modelId,
    accessRequestId: accessRequest.id,
    isActive: false,
    reviewKind: 'access',
  })

  if (isActiveReviewsError) {
    return <MessageAlert message={isActiveReviewsError.info.message} severity='error' />
  }

  if (isInactiveReviewsError) {
    return <MessageAlert message={isInactiveReviewsError.info.message} severity='error' />
  }

  return (
    <>
      {(isActiveReviewsLoading || isInactiveReviewsLoading) && <Loading />}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent='center' alignItems='center'>
        <Box
          sx={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: theme.palette.primary.main,
            width: '100%',
            borderRadius: 4,
          }}
        >
          {activeReviews.length > 0 && <ReviewBanner accessRequest={accessRequest} />}
          <Stack p={2}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              justifyContent='space-between'
              alignItems='center'
              spacing={1}
            >
              <Typography component='h2' variant='h6' color='primary'>
                {accessRequest.metadata.overview.name}
              </Typography>
              <Button
                onClick={() => router.push(`/beta/model/${accessRequest.modelId}/access-request/${accessRequest.id}`)}
              >
                View Access Request
              </Button>
            </Stack>
            <Stack spacing={1} direction='row'>
              <Tooltip
                describeChild
                title={`Created by ${accessRequest.createdBy} on ${formatDateString(accessRequest.createdAt)}`}
              >
                <div>
                  <Typography variant='caption' fontWeight='bold'>
                    {formatDateString(accessRequest.createdAt)}
                  </Typography>
                  <Typography variant='caption' sx={{ ml: 1 }}>
                    {accessRequest.createdBy}
                  </Typography>
                </div>
              </Tooltip>
            </Stack>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              alignItems='flex-end'
              justifyContent='space-between'
              spacing={4}
              mt={2}
            >
              <Box
                sx={{
                  px: 2,
                  pt: 1,
                  pb: 2,
                  width: '100%',
                  border: `1px solid ${theme.palette.primary.main}`,
                  borderRadius: 4,
                }}
              >
                <Typography variant='subtitle2' component='h3' mb={1}>
                  Users
                </Typography>
                <Grid container>
                  {accessRequest.metadata.overview.entities.map((entity) => (
                    <Grid item xs={accessRequest.metadata.overview.endDate ? 4 : 3} key={entity}>
                      <Typography variant='body2'>{entity}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              {accessRequest.metadata.overview.endDate && (
                <Box ml='auto' minWidth={170}>
                  <Typography variant='caption'>End Date:</Typography>
                  <Typography variant='caption' fontWeight='bold' sx={{ ml: 1 }}>
                    {formatDateString(accessRequest.metadata.overview.endDate)}
                  </Typography>
                </Box>
              )}
            </Stack>
            {inactiveReviews.length > 0 && <Divider sx={{ my: 2 }} />}
            {inactiveReviews.map((review) => (
              <ReviewDisplay review={review} key={review.semver} />
            ))}
          </Stack>
        </Box>
      </Stack>
    </>
  )
}
