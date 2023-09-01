import Container from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { useTheme } from '@mui/material/styles'
import { ReactNode, useState } from 'react'
import ReviewWithComment, { ResponseTypeKeys } from 'src/common/ReviewWithComment'

type Prop = {
  children: ReactNode
}

export default function ModelBanner({ children }: Prop) {
  const theme = useTheme()

  const [reviewCommentOpen, setReviewCommentOpen] = useState(false)

  const openReviewComment = () => {
    setReviewCommentOpen(true)
  }

  const closeReviewComment = () => {
    setReviewCommentOpen(false)
  }

  const handleSubmit = (kind: ResponseTypeKeys, reviewComment: string) => {
    //TODO some response to API endpoint- BAI-858
  }

  return (
    <Paper
      sx={{
        color: 'white',
        backgroundColor: theme.palette.secondary.main,
        paddingTop: '0.25rem',
        paddingBottom: '0.25rem',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}
    >
      <Container maxWidth='xl'>
        <Typography>{children}</Typography>
      </Container>
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
      <ReviewWithComment
        title=''
        description=''
        open={reviewCommentOpen}
        onClose={closeReviewComment}
        onSubmit={handleSubmit}
      />
    </Paper>
  )
}
