import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Card, Container, Divider, Stack, Typography } from '@mui/material'
import { useGetAccessRequest } from 'actions/accessRequest'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import ReviewComments from 'src/common/ReviewComments'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import AccessRequestFormEditPage from 'src/model/beta/accessRequests/AccessRequestFormEditPage'
import ReviewBanner from 'src/model/beta/reviews/ReviewBanner'
import Wrapper from 'src/Wrapper.beta'

export default function AccessRequest() {
  const router = useRouter()

  const { modelId, accessRequestId }: { modelId?: string; accessRequestId?: string } = router.query

  const { accessRequest, isAccessRequestLoading, isAccessRequestError } = useGetAccessRequest(modelId, accessRequestId)
  const {
    reviews: activeReviews,
    isReviewsLoading: isActiveReviewsLoading,
    isReviewsError: isActiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId: accessRequest?.modelId,
    accessRequestId: accessRequest?.id,
    isActive: true,
  })

  const error = MultipleErrorWrapper('Unable to load access request', {
    isAccessRequestError,
    isActiveReviewsError,
  })
  if (error) return error

  return (
    <Wrapper
      title={accessRequest ? (accessRequest.metadata.overview.name as string) : 'Loading...'}
      page='access-request'
      fullWidth
    >
      <Container maxWidth='md'>
        <Card sx={{ p: 4, m: 'auto' }}>
          {isAccessRequestLoading && isActiveReviewsLoading && <Loading />}
          {!accessRequest && !isAccessRequestLoading && (
            <EmptyBlob text={`Oh no, it looks like access request ${accessRequest} doesn't exist!`} />
          )}
          {accessRequest && (
            <Stack spacing={2}>
              {activeReviews.length > 0 && <ReviewBanner removeBorderRadius accessRequest={accessRequest} />}
              <Stack
                direction={{ sm: 'row', xs: 'column' }}
                spacing={2}
                divider={<Divider flexItem orientation='vertical' />}
              >
                <Link href={`/beta/model/${modelId}?tab=access`}>
                  <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                    Back to model
                  </Button>
                </Link>
                <Typography variant='h6' color='primary' component='h2'>
                  {accessRequest ? (accessRequest.metadata.overview.name as string) : 'Loading...'}
                </Typography>
              </Stack>
              {accessRequest && <AccessRequestFormEditPage accessRequest={accessRequest} />}
              <ReviewComments accessRequest={accessRequest} />
            </Stack>
          )}
        </Card>
      </Container>
    </Wrapper>
  )
}
