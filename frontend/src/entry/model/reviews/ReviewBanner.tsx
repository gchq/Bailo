import ReviewIcon from '@mui/icons-material/Comment'
import { Stack, Typography } from '@mui/material'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useHeadReviewRequestsForModel } from 'actions/review'
import renderQueryState from 'src/common/renderQueryState'
import { type AccessRequestInterface, type ReleaseInterface } from 'types/types'

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

  const { reviewCountHeader, isReviewsLoading, isReviewsError } = useHeadReviewRequestsForModel(
    release
      ? { modelId: release.modelId, semver: release.semver }
      : { modelId: accessRequest.modelId, accessRequestId: accessRequest.id },
  )

  const queryState = renderQueryState([isReviewsError], isReviewsLoading)
  if (queryState) {
    return queryState
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
        </Stack>
      </Paper>
    )
  )
}
