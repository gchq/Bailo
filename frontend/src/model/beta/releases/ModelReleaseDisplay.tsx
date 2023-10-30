import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import prettyBytes from 'pretty-bytes'
import Markdown from 'src/common/MarkdownRenderer'
import { formatDateString } from 'utils/dateUtils'

import { useGetReviewRequestsForModel } from '../../../../actions/review'
import { ReleaseInterface } from '../../../../types/types'
import Loading from '../../../common/Loading'
import Link from '../../../Link'
import MessageAlert from '../../../MessageAlert'
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

  return (
    <>
      {(isActiveReviewsLoading || isInactiveReviewsLoading) && <Loading />}
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
                <Box>
                  <Typography fontWeight='bold'>Artefacts</Typography>
                  {release.files.map((file) => (
                    <Stack
                      key={file._id}
                      direction={{ sm: 'row', xs: 'column' }}
                      justifyContent='space-between'
                      alignItems='center'
                      spacing={2}
                    >
                      <Link href='/beta'>{file.name}</Link>
                      <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
                    </Stack>
                  ))}{' '}
                </Box>
              )}
              {release.images.length > 0 && (
                <Box>
                  <Typography fontWeight='bold'>Docker images</Typography>
                  {release.images.map((image) => (
                    <Stack
                      key={`${image.model}-${image.version}`}
                      direction={{ sm: 'row', xs: 'column' }}
                      justifyContent='space-between'
                      alignItems='center'
                      spacing={2}
                    >
                      <Link href='/beta'>{`${image.model}-${image.version}`}</Link>
                    </Stack>
                  ))}
                </Box>
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
