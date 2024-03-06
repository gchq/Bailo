import ReviewIcon from '@mui/icons-material/Comment'
import { Stack, Typography } from '@mui/material'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useGetAccessRequestsForModelId } from 'actions/accessRequest'
import { useMemo, useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import { mutate } from 'swr'
import { getErrorMessage } from 'utils/fetcher'

import { useGetReleasesForModelId } from '../../../actions/release'
import { useGetReviewRequestsForModel } from '../../../actions/review'
import { postReviewResponse } from '../../../actions/review'
import { AccessRequestInterface, ReleaseInterface } from '../../../types/types'
import ReviewWithComment, { ResponseTypeKeys } from '../../common/ReviewWithComment'

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
  const { mutateReviews } = useGetReviewRequestsForModel({
    modelId,
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
      mutateReviews()
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
      <Stack
        direction='row'
        justifyContent='space-between'
        alignItems='center'
        spacing={2}
        sx={{ px: 2, width: '100%' }}
      >
        <Stack direction='row' spacing={1}>
          <ReviewIcon />
          <Typography>Ready for review</Typography>
        </Stack>
        <Button
          variant='outlined'
          color='inherit'
          size='small'
          onClick={handleReviewOpen}
          data-test='reviewButton'
          disabled={isReviewOpen}
        >
          Review
        </Button>
      </Stack>
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
