import { type Dayjs } from '@dayjs'
import Close from '@mui/icons-material/Close'
import {
  Button,
  type ButtonOwnProps,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Popper,
  type PopperPlacementType,
  Stack,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ArrowDropDownIcon } from 'node_modules/@mui/x-date-pickers/index.mjs'
import { useState } from 'react'
import ReviewWithComment from 'src/common/ReviewWithComment'
import MessageAlert from 'src/MessageAlert'
import { type DecisionKeys, type ReviewRequestInterface } from 'types/types'

interface ReviewPopperProps {
  isLoading: boolean
  reviews: ReviewRequestInterface[]
  errorMessage: string
  onSubmit: (kind: DecisionKeys, reviewComment: string, reviewRole: string, dueDate?: Dayjs | null) => void
  includeDueDate?: boolean
  reviewComment: string
  onReviewCommentChange: (value: string) => void
  buttonSize?: ButtonOwnProps['size']
  buttonVariant?: ButtonOwnProps['variant']
  buttonText?: string
  hideButtonIcon?: boolean
  hideRequestChangesButton?: boolean
  popperPlacement?: PopperPlacementType
}

export default function ReviewPopper({
  isLoading,
  reviews,
  includeDueDate = false,
  errorMessage,
  onSubmit,
  reviewComment,
  onReviewCommentChange,
  buttonSize = 'medium',
  buttonVariant = 'contained',
  buttonText = 'Submit reivew',
  hideButtonIcon = false,
  hideRequestChangesButton = false,
  popperPlacement = 'bottom-start',
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
        reviewComment={reviewComment}
        onReviewCommentChange={onReviewCommentChange}
        hideRequestChangesButton={hideRequestChangesButton}
      />
      <MessageAlert message={errorMessage} severity='error' />
    </Stack>
  )
  return (
    <>
      <Button
        variant={buttonVariant}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        data-test='openReviewPopperBtn'
        sx={{ height: 'max-content' }}
        endIcon={hideButtonIcon ? null : <ArrowDropDownIcon />}
        size={buttonSize}
      >
        {buttonText}
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
          placement={popperPlacement}
          modifiers={[
            {
              name: 'preventOverflow',
              enabled: true,
              options: {
                altAxis: true,
                altBoundary: true,
                tether: false,
                rootBoundary: 'viewport',
                padding: 8,
              },
            },
          ]}
          sx={{
            minWidth: '450px',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
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
