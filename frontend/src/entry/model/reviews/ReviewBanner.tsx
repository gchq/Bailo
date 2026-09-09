import ReviewIcon from '@mui/icons-material/Comment'
import { Stack, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useHeadReviewRequests } from 'actions/review'
import { useRouter } from 'next/router'
import renderQueryState from 'src/common/renderQueryState'
import {
  AccessRequestInterface,
  DeploymentAssessmentInterface,
  DeploymentAssessmentSummary,
  ReleaseInterface,
  ReviewKind,
} from 'types/types'

export type ReviewBannerProps =
  | {
      release: ReleaseInterface
      accessRequest?: never
      deploymentAssessment?: never
    }
  | {
      release?: never
      accessRequest: AccessRequestInterface
      deploymentAssessment?: never
    }
  | {
      release?: never
      accessRequest?: never
      deploymentAssessment: DeploymentAssessmentInterface | DeploymentAssessmentSummary
    }

type OptionalReviewBannerProps = {
  onReviewButtonClicked?: () => void | undefined
}

export default function ReviewBanner({
  release,
  accessRequest,
  deploymentAssessment,
  onReviewButtonClicked,
}: ReviewBannerProps & OptionalReviewBannerProps) {
  const theme = useTheme()
  const router = useRouter()

  const { reviewCountHeader, isReviewsLoading, isReviewsError } = useHeadReviewRequests({
    ...(release && { semver: release.semver, modelId: release.modelId }),
    ...(accessRequest && { accessRequestId: accessRequest.id, modelId: accessRequest.modelId }),
    ...(deploymentAssessment && { deploymentAssessmentId: deploymentAssessment.id, kind: ReviewKind.DEPLOYMENTS }),
  })

  const handleReviewOnClick = () => {
    if (onReviewButtonClicked !== undefined) {
      onReviewButtonClicked()
    } else {
      if (release) {
        router.push(`/model/${release.modelId}/release/${release.semver}/review`)
      } else if (accessRequest) {
        router.push(`/model/${accessRequest.modelId}/access-request/${accessRequest.id}/review`)
      } else if (deploymentAssessment) {
        router.push(`/deployment-assessments/${deploymentAssessment.id}/review`)
      }
    }
  }

  const queryState = renderQueryState([isReviewsError], isReviewsLoading)
  if (queryState) {
    return queryState
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
