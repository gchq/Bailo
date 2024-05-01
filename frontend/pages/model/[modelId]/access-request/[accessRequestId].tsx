import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetAccessRequest } from 'actions/accessRequest'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableAccessRequestForm from 'src/entry/model/accessRequests/EditableAccessRequestForm'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import ReviewComments from 'src/reviews/ReviewComments'

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
    <>
      <Title text={accessRequest ? accessRequest.metadata.overview.name : 'Loading...'} />
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
                  <Link href={`/model/${modelId}?tab=access`}>
                    <Button sx={{ width: 'fit-content' }} startIcon={<ArrowBack />}>
                      Back to model
                    </Button>
                  </Link>
                  <Stack direction='row' alignItems='center'>
                    <Typography variant='h6' color='primary' component='h1'>
                      {accessRequest ? accessRequest.metadata.overview.name : 'Loading...'}
                    </Typography>
                    <CopyToClipboardButton
                      textToCopy={accessRequest.id}
                      notificationText='Copied access request ID to clipboard'
                      ariaLabel='copy access request ID to clipboard'
                    />
                  </Stack>
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
    </>
  )
}
