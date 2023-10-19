import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import Markdown from 'src/common/MarkdownRenderer'

import { useGetReviewRequestsForModel } from '../../../../actions/review'
import { ReleaseInterface } from '../../../../types/types'
import Loading from '../../../common/Loading'
import Link from '../../../Link'
import MessageAlert from '../../../MessageAlert'
import ModelReleaseReviewBanner from './ModelReleaseReviewBanner'
import ModelReleaseReviewsDisplay from './ModelReleaseReviewDisplay'

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

  const { reviews, isReviewsLoading, isReviewsError } = useGetReviewRequestsForModel(modelId, release.semver, true)
  const {
    reviews: inactiveReviews,
    isReviewsLoading: isInactiveReviewsLoading,
    isReviewsError: isInactiveReviewsError,
  } = useGetReviewRequestsForModel(modelId, release.semver, false)

  function formatDate(timestamp: string) {
    const date = new Date(timestamp)
    const year = date.getFullYear().toString()
    const formattedYear = `'${year.substring(date.getFullYear().toString().length - 2)}`
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${formattedYear}`
  }

  function latestVersionAdornment() {
    if (release.semver === latestRelease) {
      return <Typography color='secondary'>(Latest)</Typography>
    }
  }

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (isInactiveReviewsError) {
    return <MessageAlert message={isInactiveReviewsError.info.message} severity='error' />
  }

  return (
    <>
      {(isReviewsLoading || isInactiveReviewsLoading) && <Loading />}
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
          {reviews.length > 0 ? (
            <ModelReleaseReviewBanner label='This release needs to be reviewed' release={release} />
          ) : undefined}
          <Box sx={{ padding: 2 }}>
            <Stack spacing={2}>
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
              <Stack spacing={1} direction='row' sx={{ mt: '0px !important' }}>
                <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
                  {formatDate(release.updatedAt)}
                </Typography>
                <Typography variant='caption'>{release.createdBy}</Typography>
              </Stack>
              <Markdown>{release.notes}</Markdown>
              {(release.files.length > 0 || release.images.length > 0) && <Divider />}
              <Stack spacing={0}>
                {release.files.map((file) => (
                  <Stack
                    key={file}
                    direction={{ sm: 'row', xs: 'column' }}
                    justifyContent='space-between'
                    alignItems='center'
                    spacing={2}
                  >
                    <Link href='/beta'>{file}</Link>
                    {/* TODO - Add file size here */}
                    {/* <Typography variant='caption'>123GB</Typography> */}
                  </Stack>
                ))}
                {release.images.map((image) => (
                  <Stack
                    key={image}
                    direction={{ sm: 'row', xs: 'column' }}
                    justifyContent='space-between'
                    alignItems='center'
                    spacing={2}
                  >
                    <Link href='/beta'>{image}</Link>
                    {/* TODO - Add file size here */}
                    {/* <Typography variant='caption'>123GB</Typography> */}
                  </Stack>
                ))}
                {inactiveReviews.length > 0 && <Divider sx={{ pt: 2 }} />}
                <Box sx={{ pt: 2 }}>
                  {inactiveReviews.map((review) => (
                    <ModelReleaseReviewsDisplay review={review} key={review.semver} />
                  ))}
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </>
  )
}
