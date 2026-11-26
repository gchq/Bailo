import ArrowBack from '@mui/icons-material/ArrowBack'
import { Button, Container, Divider, Paper, Stack, Typography } from '@mui/material'
import { useGetAccessRequest } from 'actions/accessRequest'
import { useGetResponses } from 'actions/response'
import {
  postReviewResponse,
  useGetAccessRequestReviewRequestsForModel,
  useHeadReviewRequestsForModel,
} from 'actions/review'
import { useRouter } from 'next/router'
import { useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import ReviewPopper from 'src/common/ReviewPopper'
import Title from 'src/common/Title'
import EditableAccessRequestForm from 'src/entry/model/accessRequests/EditableAccessRequestForm'
import ReleaseAccessRequestReviewSummary from 'src/entry/model/reviews/ReleaseAccessRequestReviewSummary'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import ReviewComments from 'src/reviews/ReviewComments'
import { Decision, type DecisionKeys, ReviewKind } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

export default function AccessRequest() {
  const router = useRouter()
  const { modelId, accessRequestId }: { modelId?: string; accessRequestId?: string } = router.query

  const [isEdit, setIsEdit] = useState(false)
  const [isReviewButtonLoading, setIsReviewButtonLoading] = useState(false)
  const [reviewErrorMessage, setReviewErrorMessage] = useState('')
  const [reviewComment, setReviewComment] = useState('')

  const { accessRequest, isAccessRequestLoading, isAccessRequestError, mutateAccessRequest } = useGetAccessRequest(
    modelId,
    accessRequestId,
  )
  const { reviews, isReviewsLoading, isReviewsError, mutateReviews } = useGetAccessRequestReviewRequestsForModel({
    modelId,
    accessRequestId,
  })
  const { mutateResponses } = useGetResponses([...reviews.map((review) => review._id)])
  const { reviewCountHeader, isReviewsLoading: isReviewCountLoading } = useHeadReviewRequestsForModel({
    modelId: modelId as string,
    accessRequestId: accessRequestId as string,
  })

  const latestReviewState = reviews[0] ? reviews[0].status : undefined

  const showReviewButton = reviewCountHeader > 0

  async function handleSubmitReview(decision: DecisionKeys, comment: string, role: string) {
    setReviewErrorMessage('')
    if (!modelId) {
      return setReviewErrorMessage('Could not find model ID')
    }
    if (!accessRequest) {
      return setReviewErrorMessage('Could not find access request ID')
    }

    setIsReviewButtonLoading(true)
    const res = await postReviewResponse({
      modelId,
      role,
      comment,
      decision,
      accessRequestId: accessRequestId as string,
    })

    if (!res.ok) {
      setReviewErrorMessage(await getErrorMessage(res))
    } else {
      await Promise.all([mutateReviews(), mutateAccessRequest(), mutateResponses()])
    }
    setIsReviewButtonLoading(false)
  }

  const error = MultipleErrorWrapper('Unable to load access request', {
    isAccessRequestError,
    isReviewsError,
  })
  if (error) {
    return error
  }

  if (isReviewsLoading || isReviewCountLoading) {
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
              <Stack spacing={2} sx={{ p: 4 }}>
                <Stack direction={{ sm: 'row', xs: 'column' }} sx={{ justifyContent: 'space-between', width: '100%' }}>
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
                  {showReviewButton && (
                    <ReviewPopper
                      reviews={reviews}
                      onSubmit={handleSubmitReview}
                      isLoading={isReviewButtonLoading}
                      errorMessage={reviewErrorMessage}
                      reviewComment={reviewComment}
                      onReviewCommentChange={(comment) => setReviewComment(comment)}
                    />
                  )}
                </Stack>
                <ReleaseAccessRequestReviewSummary accessRequest={accessRequest} includeResponsesSummary={false} />
                {isEdit && latestReviewState === Decision.Approve && (
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
                    mutateResponses={mutateResponses}
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
