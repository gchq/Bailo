import { Stack } from '@mui/material'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useGetReleasesForModelId } from 'actions/release'
import { useState } from 'react'
import { mutate } from 'swr'

import { postReviewResponse } from '../../../../actions/review'
import { ReleaseInterface } from '../../../../types/types'
import ReviewWithComment, { ResponseTypeKeys } from '../../../common/ReviewWithComment'

type ModelReleaseReviewBannerProps = {
  label: string
  release: ReleaseInterface
  mutateReviews: () => void
}

export default function ModelReleaseReviewBanner({ label, release, mutateReviews }: ModelReleaseReviewBannerProps) {
  const theme = useTheme()

  const { mutateReleases } = useGetReleasesForModelId(release.modelId)

  const [reviewCommentOpen, setReviewCommentOpen] = useState(false)

  const openReviewComment = () => {
    setReviewCommentOpen(true)
  }

  const closeReviewComment = () => {
    setReviewCommentOpen(false)
  }

  const handleSubmit = (kind: ResponseTypeKeys, reviewComment: string, reviewRole: string) => {
    postReviewResponse(release.modelId, release.semver, reviewRole, reviewComment, kind).then(() => {
      mutate(
        (key) => {
          return typeof key === 'string' && key.startsWith('/api/v2/reviews')
        },
        undefined,
        { revalidate: true },
      )
      mutateReviews()
      mutateReleases()
      setReviewCommentOpen(false)
    })
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
      <Stack direction='row' spacing={2} alignItems='center'>
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
      />
    </Paper>
  )
}
