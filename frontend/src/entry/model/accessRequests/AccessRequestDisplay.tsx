import CommentIcon from '@mui/icons-material/ChatBubble'
import ListAltIcon from '@mui/icons-material/ListAlt'
import { Card, Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useGetResponses } from 'actions/response'
import { useGetReviewRequestsForModel } from 'actions/review'
import { useEffect, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Loading from 'src/common/Loading'
import UserDisplay from 'src/common/UserDisplay'
import ReviewBanner from 'src/entry/model/reviews/ReviewBanner'
import ReviewDisplay from 'src/entry/model/reviews/ReviewDisplay'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { AccessRequestInterface, ResponseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'
import { latestReviewsForEachUser } from 'utils/reviewUtils'

type AccessRequestDisplayProps = {
  accessRequest: AccessRequestInterface
  hideReviewBanner?: boolean
}

export default function AccessRequestDisplay({ accessRequest, hideReviewBanner = false }: AccessRequestDisplayProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: accessRequest.modelId,
    accessRequestId: accessRequest.id,
  })
  const {
    responses: commentResponses,
    isResponsesLoading: isCommentResponsesLoading,
    isResponsesError: isCommentResponsesError,
  } = useGetResponses([accessRequest._id])
  const {
    responses: reviewResponses,
    isResponsesLoading: isReviewResponsesLoading,
    isResponsesError: isReviewResponsesError,
  } = useGetResponses([...reviews.map((review) => review._id)])

  const [reviewsWithLatestResponses, setReviewsWithLatestResponses] = useState<ResponseInterface[]>([])
  useEffect(() => {
    if (!isReviewsLoading && reviews) {
      const latestReviews = latestReviewsForEachUser(reviews, reviewResponses)
      setReviewsWithLatestResponses(latestReviews)
    }
  }, [reviews, isReviewsLoading, reviewResponses])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isReviewResponsesError) {
    return <MessageAlert message={isReviewResponsesError.info.message} severity='error' />
  }
  if (isCommentResponsesError) {
    return <MessageAlert message={isCommentResponsesError.info.message} severity='error' />
  }

  return (
    <>
      {(isReviewsLoading || isReviewResponsesLoading || isCommentResponsesLoading) && <Loading />}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent='center' alignItems='center'>
        <Card sx={{ width: '100%' }}>
          {reviews.length > 0 && !hideReviewBanner && <ReviewBanner accessRequest={accessRequest} />}
          <Stack p={2}>
            <Stack direction={{ sm: 'row', xs: 'column' }} alignItems='center' spacing={1}>
              <Link href={`/model/${accessRequest.modelId}/access-request/${accessRequest.id}`}>
                <Typography component='h2' variant='h6' color='primary'>
                  {accessRequest.metadata.overview.name}
                </Typography>
              </Link>
              <CopyToClipboardButton
                textToCopy={accessRequest.id}
                notificationText='Copied access request ID to clipboard'
                ariaLabel='copy access request ID to clipboard'
              />
            </Stack>
            <Stack spacing={1} direction='row' justifyContent='space-between' sx={{ mb: 2 }}>
              <Typography variant='caption'>
                Created by {<UserDisplay dn={accessRequest.createdBy} />} on
                <Typography variant='caption' fontWeight='bold'>
                  {` ${formatDateString(accessRequest.createdAt)} `}
                </Typography>
              </Typography>
              {accessRequest.metadata.overview.endDate && (
                <Typography variant='caption'>
                  End Date:
                  <Typography variant='caption' fontWeight='bold' data-test='accessRequestEndDate'>
                    {` ${formatDateString(accessRequest.metadata.overview.endDate)}`}
                  </Typography>
                </Typography>
              )}
            </Stack>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              alignItems='flex-end'
              justifyContent='space-between'
              spacing={4}
            >
              <Card
                sx={{
                  px: 2,
                  pt: 1,
                  pb: 2,
                  width: '100%',
                }}
              >
                <Typography variant='subtitle2' component='h3' mb={1}>
                  Users
                </Typography>
                <Grid container>
                  {accessRequest.metadata.overview.entities.map((entity) => (
                    <Grid item xs={3} key={entity}>
                      <UserDisplay dn={entity} />
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Stack>
            <Stack direction='row' justifyContent='space-between' spacing={2} sx={{ pt: 2 }}>
              <ReviewDisplay reviewResponses={reviewsWithLatestResponses} modelId={accessRequest.modelId} />
              <Stack direction='row' spacing={2}>
                {reviewResponses.length > 0 && (
                  <Tooltip title='Reviews'>
                    <Stack direction='row' spacing={1}>
                      <ListAltIcon color='primary' />
                      <Typography variant='caption' data-test='reviewCount'>
                        {reviewResponses.length}
                      </Typography>
                    </Stack>
                  </Tooltip>
                )}
                {commentResponses.length > 0 && (
                  <Tooltip title='Comments'>
                    <Stack direction='row' spacing={1}>
                      <CommentIcon color='primary' />
                      <Typography variant='caption' data-test='commentCount'>
                        {commentResponses.length}
                      </Typography>
                    </Stack>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </>
  )
}
