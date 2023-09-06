import { Stack } from '@mui/material'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import ReviewWithComment, { ResponseTypeKeys } from 'src/common/ReviewWithComment'

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
        borderRadius: 0,
      }}
    >
      <Stack direction='row' spacing={2}>
        <Typography>{label}</Typography>
        <Button
          variant='outlined'
          color='inherit'
          style={{
            color: 'white',
            maxHeight: '20px',
            minWidth: '60px',
            minHeight: '20px',
            padding: '12px',
          }}
          onClick={openReviewComment}
        >
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
