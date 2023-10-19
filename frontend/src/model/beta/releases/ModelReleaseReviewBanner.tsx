import { Stack } from '@mui/material'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { mutate } from 'swr'

import { useGetReleasesForModelId } from '../../../../actions/release'
import { useGetReviewRequestsForModel } from '../../../../actions/review'
import { postReviewResponse } from '../../../../actions/review'
import { ReleaseInterface } from '../../../../types/types'
import ReviewWithComment, { ResponseTypeKeys } from '../../../common/ReviewWithComment'

type ModelReleaseReviewBannerProps = {
  label: string
  release: ReleaseInterface
}

export default function ModelReleaseReviewBanner({ label, release }: ModelReleaseReviewBannerProps) {
  const theme = useTheme()

  const { mutateReleases } = useGetReleasesForModelId(release.modelId)
  const { mutateReviews: mutateActiveReviews } = useGetReviewRequestsForModel(release.modelId, release.semver, true)
  const { mutateReviews: mutateInactiveReviews } = useGetReviewRequestsForModel(release.modelId, release.semver, false)

  const [reviewCommentOpen, setReviewCommentOpen] = useState(false)
  const [postResponseError, setPostResponseError] = useState('')

  const openReviewComment = () => {
    setReviewCommentOpen(true)
  }

  const closeReviewComment = () => {
    setReviewCommentOpen(false)
  }

  async function handleSubmit(kind: ResponseTypeKeys, reviewComment: string, reviewRole: string) {
    setPostResponseError('')
    const res = await postReviewResponse(release.modelId, release.semver, reviewRole, reviewComment, kind)
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
      setReviewCommentOpen(false)
    } else {
      setPostResponseError('There was a problem submitting this request')
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
        borderRadius: '13px 13px 0px 0px',
      }}
    >
      <Stack direction='row' spacing={2} alignItems='center' sx={{ px: 2 }}>
        <Typography>{label}</Typography>
        <Button variant='outlined' color='inherit' size='small' onClick={openReviewComment}>
          Review
        </Button>
      </Stack>
      <ReviewWithComment
        title='Release review'
        open={reviewCommentOpen}
        onClose={closeReviewComment}
        onSubmit={handleSubmit}
        release={release}
        errorText={postResponseError}
      />
    </Paper>
  )
}
