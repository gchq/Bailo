import { Dayjs } from '@dayjs'
import { Button, Dialog, DialogContent, Paper, Popper, Stack, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import ReviewWithComment from 'src/common/ReviewWithComment'
import MessageAlert from 'src/MessageAlert'
import { DecisionKeys, ReviewRequestInterface } from 'types/types'

interface ReviewPopperProps {
  isLoading: boolean
  reviews: ReviewRequestInterface[]
  errorMessage: string
  onSubmit: (kind: DecisionKeys, reviewComment: string, reviewRole: string, dueDate?: Dayjs | null) => void
  includeDueDate?: boolean
  deploymentAssessmentReview?: boolean
}

export default function ReviewPopper({
  isLoading,
  reviews,
  includeDueDate = false,
  errorMessage,
  onSubmit,
  deploymentAssessmentReview = false,
}: ReviewPopperProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const handleSubmit = (kind: DecisionKeys, reviewComment: string, reviewRole: string, dueDate?: Dayjs | null) => {
    setAnchorEl(null)
    onSubmit(kind, reviewComment, reviewRole, dueDate)
  }
  return (
    <>
      <Button
        variant='contained'
        onClick={(e) => setAnchorEl(e.currentTarget)}
        data-test='openReviewPopperBtn'
        sx={{ height: 'max-content' }}
      >
        Submit review
      </Button>
      {isSmallScreen ? (
        <Dialog open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} fullScreen>
          <DialogContent sx={{ p: 2 }}>
            <Stack spacing={2} sx={{ maxWidth: '100%' }}>
              <ReviewWithComment
                onSubmit={handleSubmit}
                reviews={reviews}
                loading={isLoading}
                includeDueDate={includeDueDate}
                onCancel={() => setAnchorEl(null)}
                deploymentAssessmentReview={deploymentAssessmentReview}
              />
              <MessageAlert message={errorMessage} severity='error' />
            </Stack>
          </DialogContent>
        </Dialog>
      ) : (
        <Popper
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          sx={{
            minWidth: '450px',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
            position: 'fixed !important',
            left: '80% !important',
            top: '10% !important',
            transform: 'translateX(-50%) !important', // Center it at the top
            zIndex: (theme) => theme.zIndex.tooltip,
          }}
        >
          <Paper
            sx={{
              border: 'solid',
              borderWidth: 1,
              borderColor: theme.palette.divider,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <Stack direction='row' sx={{ p: 2 }}>
              <Stack spacing={2} sx={{ maxWidth: '100%' }}>
                <ReviewWithComment
                  onSubmit={handleSubmit}
                  reviews={reviews}
                  loading={isLoading}
                  includeDueDate={includeDueDate}
                  onCancel={() => setAnchorEl(null)}
                  deploymentAssessmentReview={deploymentAssessmentReview}
                />
                <MessageAlert message={errorMessage} severity='error' />
              </Stack>
            </Stack>
          </Paper>
        </Popper>
      )}
    </>
  )
}
