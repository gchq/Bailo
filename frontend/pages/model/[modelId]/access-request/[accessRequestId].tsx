import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetAccessRequest } from 'actions/accessRequest'
import { useGetAccessRequestReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import Title from 'src/common/Title'
import EditableAccessRequestForm from 'src/entry/model/accessRequests/EditableAccessRequestForm'
import ReleaseAccessRequestReviewSummary from 'src/entry/model/reviews/ReleaseAccessRequestReviewSummary'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import ReviewComments from 'src/reviews/ReviewComments'
import { ReviewKind } from 'types/types'

export default function AccessRequest() {
  const router = useRouter()
  const { modelId, accessRequestId }: { modelId?: string; accessRequestId?: string } = router.query

  const [isEdit, setIsEdit] = useState(false)

  const { accessRequest, isAccessRequestLoading, isAccessRequestError, mutateAccessRequest } = useGetAccessRequest(
    modelId,
    accessRequestId,
  )

  const { reviews, isReviewsLoading, isReviewsError } = useGetAccessRequestReviewRequestsForModel({
    modelId,
    accessRequestId,
  })

  const latestReviewState = reviews[0].status

  const error = MultipleErrorWrapper('Unable to load access request', {
    isAccessRequestError,
    isReviewsError,
  })
  if (error) {
    return error
  }

  if (isReviewsLoading) {
    return <Loading />
  }
  return (
    <>
      <Title text={accessRequest ? accessRequest.metadata.overview.name : 'Loading...'} />
      <Container maxWidth='lg' sx={{ my: 4 }} data-test='accessRequestContainer'>
        <Paper>
          {isAccessRequestLoading && <Loading />}
          {accessRequest && (
            <>
              <ReviewBanner accessRequest={accessRequest} />
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
                  <Stack
                    direction='row'
                    sx={{
                      alignItems: 'center',
                    }}
                  >
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
                <ReleaseAccessRequestReviewSummary accessRequest={accessRequest} includeResponsesSummary={false} />
                {isEdit && latestReviewState && (
                  <MessageAlert
                    message='Saving changes to this access request will revoke the approval status'
                    severity='warning'
                  />
                )}
                {accessRequest && (
                  <EditableAccessRequestForm
                    accessRequest={accessRequest}
                    isEdit={isEdit}
                    onIsEditChange={setIsEdit}
                    latestReviewState={latestReviewState}
                  />
                )}
                <ReviewComments
                  identifier={accessRequest.id}
                  parentId={accessRequest._id}
                  entryId={accessRequest.modelId}
                  kind={ReviewKind.ACCESS}
                  isEdit={isEdit}
                  mutator={mutateAccessRequest}
                />
              </Stack>
            </>
          )}
        </Paper>
      </Container>
    </>
  )
}
