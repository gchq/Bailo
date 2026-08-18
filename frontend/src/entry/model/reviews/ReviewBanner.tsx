import ReviewIcon from '@mui/icons-material/Comment'
import { Stack, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useHeadReviewRequestsForModel } from 'actions/review'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { AccessRequestInterface, ReleaseInterface } from 'types/types'

export type ReviewBannerProps =
  | {
      release: ReleaseInterface
      accessRequest?: never
    }
  | {
      release?: never
      accessRequest: AccessRequestInterface
    }

export default function ReviewBanner({ release, accessRequest }: ReviewBannerProps) {
  const theme = useTheme()
  const router = useRouter()

  const [modelId, urlParam, semverOrAccessRequestId] = useMemo(
    () =>
      release
        ? [release.modelId, 'release', release.semver, { release }]
        : [accessRequest.modelId, 'access-request', accessRequest.id, { accessRequest }],
    [release, accessRequest],
  )
  const { reviewCountHeader, isReviewsLoading, isReviewsError } = useHeadReviewRequestsForModel(
    release
      ? { modelId: release.modelId, semver: release.semver }
      : { modelId: accessRequest.modelId, accessRequestId: accessRequest.id },
  )

  const handleReviewOnClick = () => {
    router.push(`/model/${modelId}/${urlParam}/${semverOrAccessRequestId}/review`)
  }

  if (isReviewsLoading) {
    return <Loading />
  }

  if (isReviewsError) {
    return <MessageAlert message={isReviewsError.info.message} severity='error' />
  }

  if (release && release.draft) {
    return <></>
  }

  return (
    reviewCountHeader > 0 && (
      <Paper
        sx={{
          color: 'white',
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : 'unset',
          py: 1,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: theme.palette.primary.main,
          borderRadius: 0,
        }}
      >
        <Stack
          direction='row'
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            width: '100%',
          }}
        >
          <Stack direction='row' spacing={1}>
            <ReviewIcon />
            <Typography>Ready for review</Typography>
          </Stack>
          <Button
            variant='outlined'
            color='inherit'
            size='small'
            onClick={handleReviewOnClick}
            data-test='reviewButton'
          >
            Review
          </Button>
        </Stack>
      </Paper>
    )
  )
}
