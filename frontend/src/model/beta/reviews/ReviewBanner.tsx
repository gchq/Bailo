import ReviewRequiredIcon from '@mui/icons-material/InfoOutlined'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { useMemo, useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import { mutate } from 'swr'
import { AccessRequestInterface } from 'types/interfaces'
import { getErrorMessage } from 'utils/fetcher'

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
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [modelId, reviewTitle, semverOrAccessRequestIdObject, dynamicReviewWithCommentProps] = useMemo(
    () =>
      release
        ? [release.modelId, 'Release Review', { semver: release.semver }, { release }]
        : [accessRequest.modelId, 'Access Request Review', { accessRequestId: accessRequest.id }, { accessRequest }],
    [release, accessRequest],
  )

  const { mutateReleases } = useGetReleasesForModelId(modelId)
  const { isAccessRequestsError, mutateAccessRequests } = useGetAccessRequestsForModelId(modelId)
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
    setErrorMessage('')
    setLoading(true)

    const res = await postReviewResponse({
      modelId,
      decision,
      comment,
      role,
      ...semverOrAccessRequestIdObject,
    })

    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
    } else {
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
    }
    setLoading(false)
  }

  if (isAccessRequestsError) {
    return <MessageAlert message={isAccessRequestsError.info.message} severity='error' />
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
        borderRadius: 0,
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
        errorMessage={errorMessage}
        onClose={handleReviewClose}
        onSubmit={handleSubmit}
        loading={loading}
        {...dynamicReviewWithCommentProps}
      />
    </Paper>
  )
}
