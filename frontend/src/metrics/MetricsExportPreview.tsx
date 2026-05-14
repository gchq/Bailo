import { Button, Container, Dialog, DialogActions, DialogContent } from '@mui/material'
import { ReactElement, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Transition } from 'src/common/Transition'

interface MetricsExportPreviewProps {
  open: boolean
  setOpen: (isOpen: boolean) => void
  content: ReactElement
}

export default function MetricsExportPreview({ open, setOpen, content }: MetricsExportPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const exportMetricsOverview = useReactToPrint({
    contentRef: contentRef,
    documentTitle: 'Bailo overview metrics',
  })

  const handleExportOnClick = () => {
    if (contentRef) {
      exportMetricsOverview()
    }
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='lg' slots={{ transition: Transition }}>
      <DialogContent ref={contentRef}>
        <Container>{content}</Container>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' variant='outlined' onClick={() => setOpen(false)}>
          Close
        </Button>
        <Button color='secondary' variant='contained' onClick={handleExportOnClick}>
          Export
        </Button>
      </DialogActions>
    </Dialog>
  )
}
