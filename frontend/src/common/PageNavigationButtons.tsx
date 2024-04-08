import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material'
import { Button, Divider, Stack } from '@mui/material'

interface PageNavigationButtonsProps {
  currentIndex: number
  maxPages: number
  navigateForward: () => void
  navigateBackward: () => void
  nextPageAriaLabel?: string
  previousPageAriaLabel?: string
}

export default function PageNavigationButtons({
  currentIndex,
  maxPages,
  navigateForward,
  navigateBackward,
  nextPageAriaLabel = '',
  previousPageAriaLabel = '',
}: PageNavigationButtonsProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      divider={<Divider flexItem orientation='vertical' />}
      justifyContent='center'
      sx={{ width: '100%', display: 'none' }}
    >
      <Button
        data-test='previousPageButton'
        startIcon={<ArrowBackIos />}
        size='small'
        onClick={navigateBackward}
        disabled={currentIndex === 1}
        aria-label={previousPageAriaLabel}
      >
        Previous page
      </Button>
      <Button
        data-test='nextPageButton'
        endIcon={<ArrowForwardIos />}
        size='small'
        onClick={navigateForward}
        disabled={currentIndex >= maxPages}
        aria-label={nextPageAriaLabel}
      >
        Next page
      </Button>
    </Stack>
  )
}
