import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetUiConfig } from 'actions/uiConfig'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import { formatDateString } from 'utils/dateUtils'

import { useGetReviewRequestsForModel } from '../../../../actions/review'
import { ReleaseInterface } from '../../../../types/types'
import Loading from '../../../common/Loading'
import Markdown from '../../../common/MarkdownDisplay'
import Link from '../../../Link'
import MessageAlert from '../../../MessageAlert'
import CodeLine from '../../../model/beta/registry/CodeLine'
import ReviewBanner from '../reviews/ReviewBanner'
import ReviewDisplay from '../reviews/ReviewDisplay'

export default function ModelReleaseDisplay({
  modelId,
  release,
  latestRelease,
}: {
  modelId: string
  release: ReleaseInterface
  latestRelease: string
}) {
  const theme = useTheme()
  const router = useRouter()

  const {
    reviews: activeReviews,
    isReviewsLoading: isActiveReviewsLoading,
    isReviewsError: isActiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId,
    semver: release.semver,
    isActive: true,
  })
  const {
    reviews: inactiveReviews,
    isReviewsLoading: isInactiveReviewsLoading,
    isReviewsError: isInactiveReviewsError,
  } = useGetReviewRequestsForModel({
    modelId,
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
        <Box
          sx={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: theme.palette.primary.main,
            width: '100%',
            borderRadius: 4,
          }}
        >
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
                <Typography component='h2' variant='h6' color='primary'>
                  {modelId} - {release.semver}
                </Typography>
                {latestVersionAdornment()}
              </Stack>
              <Button onClick={() => router.push(`/beta/model/${modelId}/history/${release.modelCardVersion}`)}>
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
                {` ${formatDateString(release.createdAt)} `}
              </Typography>
            </Typography>
            <Markdown>{release.notes}</Markdown>
            <Box>{(release.files.length > 0 || release.images.length > 0) && <Divider />}</Box>
            <Stack spacing={2}>
              {release.files.length > 0 && (
                <>
                  <Typography fontWeight='bold'>Artefacts</Typography>
                  {release.files.map((file) => (
                    <Stack
                      key={file._id}
                      direction={{ sm: 'row', xs: 'column' }}
                      justifyContent='space-between'
                      alignItems='center'
                      spacing={1}
                    >
                      <Link href={`/api/v2/model/${modelId}/file/${file._id}/download`}>{file.name}</Link>
                      <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
                    </Stack>
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
                        <CodeLine line={`${uiConfig.registry.host}/${modelId}/${image.name}:${image.tag}`} />
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
        </Box>
      </Stack>
    </>
  )
}
