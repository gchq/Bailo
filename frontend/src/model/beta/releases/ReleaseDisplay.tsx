import { Box, Button, Card, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import { formatDateString } from 'utils/dateUtils'

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

  const {
    reviews: activeReviews,
    isReviewsLoading: isActiveReviewsLoading,
    isReviewsError: isActiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId: model.id,
    semver: release.semver,
    isActive: true,
  })
  const {
    reviews: inactiveReviews,
    isReviewsLoading: isInactiveReviewsLoading,
    isReviewsError: isInactiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId: model.id,
    semver: release.semver,
    isActive: false,
  })
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  function latestVersionAdornment() {
    if (release.semver === latestRelease) {
      return <Typography color='secondary'>(Latest)</Typography>
    }
  }

  if (isActiveReviewsError) {
    return <MessageAlert message={isActiveReviewsError.info.message} severity='error' />
  }

  if (isInactiveReviewsError) {
    return <MessageAlert message={isInactiveReviewsError.info.message} severity='error' />
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <>
      {(isActiveReviewsLoading || isInactiveReviewsLoading || isUiConfigLoading) && <Loading />}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent='center' alignItems='center'>
        <Card variant='outlined' sx={{ width: '100%' }}>
          {activeReviews.length > 0 && <ReviewBanner release={release} />}
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
              Created by
              <Typography variant='caption' fontWeight='bold'>
                {` ${release.createdBy} `}
              </Typography>
              on
              <Typography variant='caption' fontWeight='bold'>
                {` ${formatDateString(release.createdAt)}`}
              </Typography>
            </Typography>
            <Markdown>{release.notes}</Markdown>
            <Box>{(release.files.length > 0 || release.images.length > 0) && <Divider />}</Box>
            <Stack spacing={2}>
              {release.files.length > 0 && (
                <>
                  <Typography fontWeight='bold'>Artefacts</Typography>
                  {release.files.map((file) => (
                    <div key={file._id}>
                      <Grid container spacing={1}>
                        <Grid item xs>
                          <Tooltip title={file.name}>
                            <Link href={`/api/v2/model/${model.id}/file/${file._id}/download`}>
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
              {inactiveReviews.length > 0 && <Divider sx={{ my: 2 }} />}
              {inactiveReviews.map((review) => (
                <ReviewDisplay review={review} key={review.semver} />
              ))}
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </>
  )
}
