import CommentIcon from '@mui/icons-material/ChatBubble'
import { Card, Grid, Stack, Typography } from '@mui/material'
import { groupBy } from 'lodash-es'
import { useEffect, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import UserDisplay from 'src/common/UserDisplay'
import Link from 'src/Link'
import { AccessRequestInterface, ReviewRequestInterface, ReviewResponse } from 'types/types'
import { formatDateString, sortByCreatedAtAscending } from 'utils/dateUtils'
import { plural } from 'utils/stringUtils'

import { useGetReviewRequestsForModel } from '../../../actions/review'
import Loading from '../../common/Loading'
import MessageAlert from '../../MessageAlert'
import ReviewBanner from '../reviews/ReviewBanner'
import ReviewDisplay from '../reviews/ReviewDisplay'

type AccessRequestDisplayProps = {
  accessRequest: AccessRequestInterface
  hideReviewBanner?: boolean
}

export default function AccessRequestDisplay({ accessRequest, hideReviewBanner = false }: AccessRequestDisplayProps) {
  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: accessRequest.modelId,
    accessRequestId: accessRequest.id,
  })

  const [reviewsWithLatestResponses, setReviewsWithLatestResponses] = useState<ReviewRequestInterface[]>([])

  useEffect(() => {
    if (!isReviewsLoading && reviews) {
      const result = reviews
      result.forEach((review) => {
        const groupedResponses: GroupedReviewResponse = groupBy(review.responses, (response) => response.user)
        Object.keys(groupedResponses).forEach((user) => {
          review.responses = [groupedResponses[user].sort(sortByCreatedAtAscending)[groupedResponses[user].length - 1]]
        })
      })
      setReviewsWithLatestResponses(result)
    }
  }, [reviews, isReviewsLoading])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  interface GroupedReviewResponse {
    [user: string]: ReviewResponse[]
  }

  return (
    <>
      {isReviewsLoading && <Loading />}
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
                textToCopy={accessRequest.metadata.overview.name}
                notificationText='Copied access request name to clipboard'
                ariaLabel='copy access request name to clipboard'
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
              <ReviewDisplay reviews={reviewsWithLatestResponses} />
              {accessRequest.comments.length > 0 && (
                <Stack direction='row' spacing={1}>
                  <CommentIcon color='primary' data-test='commentIcon' />
                  <Typography variant='caption' data-test='commentCount'>
                    {plural(accessRequest.comments.length, 'comment')}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </>
  )
}
