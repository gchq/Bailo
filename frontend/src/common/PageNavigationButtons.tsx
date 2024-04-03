import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material'
import { Button, Divider, Stack } from '@mui/material'

interface PageNavigationButtonsProps {
  currentIndex: number
  maxPages: number
  navigateForward: () => void
  navigateBackward: () => void
  nextPageLabel?: string
  previousPageLabel?: string
}

export default function PageNavigationButtons({
  currentIndex,
  maxPages,
  navigateForward,
  navigateBackward,
  nextPageLabel = '',
  previousPageLabel = '',
}: PageNavigationButtonsProps) {
  return (
    <Stack
      direction='row'
      spacing={2}
      divider={<Divider flexItem orientation='vertical' />}
      justifyContent='center'
      sx={{ width: '100%' }}
    >
      <Button
        data-test='previousPageButton'
        startIcon={<ArrowBackIos />}
        size='small'
        onClick={navigateBackward}
        disabled={currentIndex === 1}
        aria-label={previousPageLabel}
      >
        Previous page
      </Button>
      <Button
        data-test='nextPageButton'
        endIcon={<ArrowForwardIos />}
        size='small'
        onClick={navigateForward}
        disabled={currentIndex >= maxPages}
        aria-label={nextPageLabel}
      >
        Next page
      </Button>
    </Stack>
  )
}
