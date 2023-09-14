import { Stack } from '@mui/material'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'

import ReviewWithComment, { ResponseTypeKeys } from '../../../common/ReviewWithComment'

type ModelReleaseReviewBannerProps = {
  label: string
}

export default function ModelReleaseReviewBanner({ label }: ModelReleaseReviewBannerProps) {
  const theme = useTheme()

  const [reviewCommentOpen, setReviewCommentOpen] = useState(false)

  const openReviewComment = () => {
    setReviewCommentOpen(true)
  }

  const closeReviewComment = () => {
    setReviewCommentOpen(false)
  }

  const handleSubmit = (_kind: ResponseTypeKeys, _reviewComment: string) => {
    //TODO some response to API endpoint- BAI-858
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
      />
    </Paper>
  )
}
