import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetAccessRequest } from 'actions/accessRequest'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import EditableAccessRequestForm from 'src/model/accessRequests/EditableAccessRequestForm'
import ReviewBanner from 'src/model/reviews/ReviewBanner'
import ReviewComments from 'src/reviews/ReviewComments'
import Wrapper from 'src/Wrapper.beta'

export default function AccessRequest() {
  const router = useRouter()
  const { modelId, accessRequestId }: { modelId?: string; accessRequestId?: string } = router.query

  const [isEdit, setIsEdit] = useState(false)

  const { accessRequest, isAccessRequestLoading, isAccessRequestError } = useGetAccessRequest(modelId, accessRequestId)
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId,
    accessRequestId: accessRequestId || '',
  })

  const error = MultipleErrorWrapper('Unable to load access request', {
    isAccessRequestError,
    isReviewsError,
  })
  if (error) return error

  return (
    <Wrapper
      title={accessRequest ? accessRequest.metadata.overview.name : 'Loading...'}
      page='access-request'
      fullWidth
    >
      <Container maxWidth='md' sx={{ my: 4 }} data-test='accessRequestContainer'>
        <Paper>
          {isAccessRequestLoading && isReviewsLoading && <Loading />}
          {accessRequest && (
            <>
              {reviews.length > 0 && <ReviewBanner accessRequest={accessRequest} />}
              <Stack spacing={2} sx={{ p: 4 }}>
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
                  <Typography variant='h6' color='primary' component='h1'>
                    {accessRequest ? accessRequest.metadata.overview.name : 'Loading...'}
                  </Typography>
                </Stack>
                {accessRequest && (
                  <EditableAccessRequestForm accessRequest={accessRequest} isEdit={isEdit} onIsEditChange={setIsEdit} />
                )}
                <ReviewComments accessRequest={accessRequest} isEdit={isEdit} />
              </Stack>
            </>
          )}
        </Paper>
      </Container>
    </Wrapper>
  )
}
