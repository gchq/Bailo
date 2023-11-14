import ReviewRequiredIcon from '@mui/icons-material/InfoOutlined'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { useMemo, useState } from 'react'
import { mutate } from 'swr'
import { AccessRequestInterface } from 'types/interfaces'

import { useGetReleasesForModelId } from '../../../../actions/release'
import { useGetReviewRequestsForModel } from '../../../../actions/review'
import { postReviewResponse } from '../../../../actions/review'
import { ReleaseInterface } from '../../../../types/types'
import ReviewWithComment, { ResponseTypeKeys } from '../../../common/ReviewWithComment'

type ReviewBannerProps =
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
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [postResponseError, setPostResponseError] = useState('')
  const [loading, setLoading] = useState(false)

  const [modelId, reviewTitle, semverOrAccessRequestIdObject, dynamicReviewWithCommentProps] = useMemo(
    () =>
      release
        ? [release.modelId, 'Release Review', { semver: release.semver }, { release }]
        : [accessRequest.modelId, 'Access Request Review', { accessRequestId: accessRequest.id }, { accessRequest }],
    [release, accessRequest],
  )

  const { mutateReleases } = useGetReleasesForModelId(modelId)
  const { mutateAccessRequests } = useGetAccessRequestsForModelId(modelId)
  const { mutateReviews: mutateActiveReviews } = useGetReviewRequestsForModel({
    modelId,
    isActive: true,
    ...semverOrAccessRequestIdObject,
  })
  const { mutateReviews: mutateInactiveReviews } = useGetReviewRequestsForModel({
    modelId,
    isActive: false,
    ...semverOrAccessRequestIdObject,
  })

  const handleReviewOpen = () => {
    setIsReviewOpen(true)
  }

  const handleReviewClose = () => {
    setIsReviewOpen(false)
  }

  async function handleSubmit(decision: ResponseTypeKeys, comment: string, role: string) {
    setLoading(true)
    setPostResponseError('')
    const res = await postReviewResponse({
      modelId,
      decision,
      comment,
      role,
      ...semverOrAccessRequestIdObject,
    })
    if (res.status === 200) {
      mutate(
        (key) => {
          return typeof key === 'string' && key.startsWith('/api/v2/reviews')
        },
        undefined,
        { revalidate: true },
      )
      mutateActiveReviews()
      mutateInactiveReviews()
      mutateReleases()
      mutateAccessRequests()
      setIsReviewOpen(false)
      setLoading(false)
    } else {
      setPostResponseError('There was a problem submitting this review')
    }
  }

  return (
    <Paper
      sx={{
        color: 'white',
        backgroundColor: theme.palette.primary.main,
        py: 1,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: theme.palette.primary.main,
        borderRadius: '4px 4px 0px 0px',
      }}
    >
      <Grid container spacing={2} alignItems='center' sx={{ px: 2 }}>
        <Grid item xs={4} sx={{ display: 'flex' }}>
          <ReviewRequiredIcon sx={{ my: 'auto' }} />
        </Grid>
        <Grid item xs={4} sx={{ display: 'flex' }}>
          <Typography sx={{ mx: 'auto' }}>Review required</Typography>
        </Grid>
        <Grid item xs={4} sx={{ display: 'flex' }}>
          <Button variant='outlined' color='inherit' size='small' onClick={handleReviewOpen} sx={{ ml: 'auto' }}>
            Review
          </Button>
        </Grid>
      </Grid>
      <ReviewWithComment
        title={reviewTitle}
        open={isReviewOpen}
        errorText={postResponseError}
        onClose={handleReviewClose}
        onSubmit={handleSubmit}
        loading={loading}
        {...dynamicReviewWithCommentProps}
      />
    </Paper>
  )
}
