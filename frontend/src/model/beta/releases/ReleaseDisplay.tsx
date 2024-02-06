import CommentIcon from '@mui/icons-material/ChatBubble'
import { Box, Button, Card, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import _ from 'lodash'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import { useEffect, useState } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import { ReviewRequestInterface, ReviewResponse } from 'types/interfaces'
import { formatDateString, sortByCreatedAtAscending } from 'utils/dateUtils'

import { useGetReviewRequestsForModel } from '../../../../actions/review'
import { ReleaseInterface } from '../../../../types/types'
import { ModelInterface } from '../../../../types/v2/types'
import Loading from '../../../common/Loading'
import Markdown from '../../../common/MarkdownDisplay'
import Link from '../../../Link'
import MessageAlert from '../../../MessageAlert'
import CodeLine from '../registry/CodeLine'
import ReviewBanner from '../reviews/ReviewBanner'
import ReviewDisplay from '../reviews/ReviewDisplay'

export default function ReleaseDisplay({
  model,
  release,
  latestRelease,
}: {
  model: ModelInterface
  release: ReleaseInterface
  latestRelease: string
}) {
  const router = useRouter()

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel({
    modelId: model.id,
    semver: release.semver,
  })

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const [reviewsWithLatestResponses, setReviewsWithLatestResponses] = useState<ReviewRequestInterface[]>([])

  function latestVersionAdornment() {
    if (release.semver === latestRelease) {
      return <Typography color='secondary'>(Latest)</Typography>
    }
  }

  interface GroupedReviewResponse {
    [user: string]: ReviewResponse[]
  }

  useEffect(() => {
    if (!isReviewsLoading && reviews) {
      const latestReviews: ReviewRequestInterface[] = []
      reviews.forEach((review) => {
        const reviewResult: ReviewRequestInterface = _.cloneDeep(review)
        const groupedResponses: GroupedReviewResponse = _.groupBy(reviewResult.responses, (response) => response.user)
        const latestResponses: ReviewResponse[] = []
        Object.keys(groupedResponses).forEach((user) => {
          latestResponses.push(groupedResponses[user].sort(sortByCreatedAtAscending)[groupedResponses[user].length - 1])
        })
        reviewResult.responses = latestResponses
        latestReviews.push(reviewResult)
      })
      setReviewsWithLatestResponses(latestReviews)
    }
  }, [reviews, isReviewsLoading])

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <>
      {(isReviewsLoading || isUiConfigLoading) && <Loading />}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent='center' alignItems='center'>
        <Card sx={{ width: '100%' }}>
          {reviews.length > 0 && <ReviewBanner release={release} />}
          <Stack spacing={1} p={2}>
            <Stack
              direction={{ sm: 'row', xs: 'column' }}
              justifyContent='space-between'
              alignItems='center'
              spacing={2}
            >
              <Stack
                direction={{ sm: 'row', xs: 'column' }}
                justifyContent='space-between'
                alignItems='center'
                spacing={1}
              >
                <Link href={`/beta/model/${model.id}/release/${release.semver}`}>
                  <Typography component='h2' variant='h6' color='primary'>
                    {model.name} - {release.semver}
                  </Typography>
                </Link>
                {latestVersionAdornment()}
              </Stack>
              <Button onClick={() => router.push(`/beta/model/${model.id}/history/${release.modelCardVersion}`)}>
                View Model Card
              </Button>
            </Stack>
            <Typography variant='caption' sx={{ mb: 2 }}>
              Created by {<UserDisplay dn={release.createdBy} />} on
              <Typography variant='caption' fontWeight='bold'>
                {` ${formatDateString(release.createdAt)}`}
              </Typography>
            </Typography>
            <Markdown>{release.notes}</Markdown>
            <Box>{(release.files.length > 0 || release.images.length > 0) && <Divider />}</Box>
            <Stack spacing={1}>
              {release.files.length > 0 && (
                <>
                  <Typography fontWeight='bold'>Files</Typography>
                  {release.files.map((file) => (
                    <div key={file._id}>
                      <Grid container spacing={1} alignItems='center'>
                        <Grid item xs>
                          <Tooltip title={file.name}>
                            <Link
                              href={`/api/v2/model/${model.id}/file/${file._id}/download`}
                              data-test={`fileLink-${file.name}`}
                            >
                              <Typography noWrap textOverflow='ellipsis' display='inline'>
                                {file.name}
                              </Typography>
                            </Link>
                          </Tooltip>
                        </Grid>
                        <Grid item xs={1} textAlign='right'>
                          <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
                        </Grid>
                      </Grid>
                    </div>
                  ))}
                </>
              )}
              {release.images.length > 0 && (
                <>
                  <Typography fontWeight='bold'>Docker images</Typography>
                  {release.images.map((image) => (
                    <Stack
                      key={`${image.repository}-${image.name}-${image.tag}`}
                      direction={{ sm: 'row', xs: 'column' }}
                      justifyContent='space-between'
                      alignItems='center'
                      spacing={1}
                    >
                      {uiConfig && (
                        <CodeLine line={`${uiConfig.registry.host}/${model.id}/${image.name}:${image.tag}`} />
                      )}
                    </Stack>
                  ))}
                </>
              )}
              {(reviewsWithLatestResponses.length > 0 || release.comments.length > 0) && <Divider sx={{ my: 2 }} />}
              <Stack direction='row' justifyContent='space-between' spacing={2}>
                <div>
                  <ReviewDisplay reviews={reviewsWithLatestResponses} />
                </div>
                {release.comments.length > 0 && (
                  <Tooltip title='Comments'>
                    <Stack direction='row' spacing={1}>
                      <CommentIcon color='primary' />
                      <Typography variant='caption'>{release.comments.length}</Typography>
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
