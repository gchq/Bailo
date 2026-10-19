import { Dayjs } from '@dayjs'
import Close from '@mui/icons-material/Close'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Popper,
  Stack,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowDropDownIcon } from 'node_modules/@mui/x-date-pickers/index.mjs'
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
  reviewComment: string
  onReviewCommentChange: (value: string) => void
}

export default function ReviewPopper({
  isLoading,
  reviews,
  includeDueDate = false,
  errorMessage,
  onSubmit,
  deploymentAssessmentReview = false,
  reviewComment,
  onReviewCommentChange,
}: ReviewPopperProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const handleSubmit = (kind: DecisionKeys, reviewComment: string, reviewRole: string, dueDate?: Dayjs | null) => {
    setAnchorEl(null)
    onSubmit(kind, reviewComment, reviewRole, dueDate)
  }

  const reviewPopperContent = () => (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <ReviewWithComment
        onSubmit={handleSubmit}
        reviews={reviews}
        loading={isLoading}
        includeDueDate={includeDueDate}
        onCancel={() => setAnchorEl(null)}
        deploymentAssessmentReview={deploymentAssessmentReview}
        reviewComment={reviewComment}
        onReviewCommentChange={onReviewCommentChange}
      />
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
  return (
    <>
      <Button
        variant='contained'
        onClick={(e) => setAnchorEl(e.currentTarget)}
        data-test='openReviewPopperBtn'
        sx={{ height: 'max-content' }}
        endIcon={<ArrowDropDownIcon />}
      >
        Submit review
      </Button>
      {isSmallScreen ? (
        <Dialog open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} fullScreen>
          <DialogTitle sx={{ textAlign: 'right' }}>
            <IconButton onClick={() => setAnchorEl(null)}>
              <Close color='error' />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2 }}>{reviewPopperContent()}</DialogContent>
        </Dialog>
      ) : (
        <Popper
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          sx={{
            minWidth: '450px',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
            position: 'fixed !important',
            top: '10% !important',
            // Override Popper.js inline positioning so it stays pinned to the right edge
            left: 'auto !important',
            right: `${theme.spacing(4)} !important`,
            transform: 'none !important',
            maxWidth: `calc(100vw - ${theme.spacing(8)})`,
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
              width: '100%',
            }}
          >
            <Stack direction='row' sx={{ p: 2, width: '100%' }}>
              {reviewPopperContent()}
            </Stack>
          </Paper>
        </Popper>
      )}
    </>
  )
}
