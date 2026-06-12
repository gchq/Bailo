import { Button, Container, Dialog, DialogActions, DialogContent, Divider, Stack, Typography } from '@mui/material'
import Image from 'next/image'
import logo from 'public/horizontal-dark.png'
import { ReactElement, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Transition } from 'src/common/Transition'

interface MetricsExportPreviewProps {
  open: boolean
  setOpen: (isOpen: boolean) => void
  content: ReactElement
  exportDocumentTitle: string
}

export default function MetricsExportPreview({
  open,
  setOpen,
  content,
  exportDocumentTitle,
}: MetricsExportPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  const exportMetricsOverview = useReactToPrint({
    contentRef: contentRef,
    documentTitle: exportDocumentTitle,
  })

  const handleExportOnClick = () => {
    if (contentRef) {
      exportMetricsOverview()
    }
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='lg' slots={{ transition: Transition }}>
      <DialogContent ref={contentRef}>
        <Stack spacing={2} divider={<Divider />}>
          <Stack direction='row' sx={{ alignItems: 'center' }}>
            <Image src={logo} alt='bailo logo' width={180} height={70} />
            <Typography variant='h4' component='h1' sx={{ pl: 1, fontWeight: 'bold' }} color='primary'>
              {exportDocumentTitle}
            </Typography>
          </Stack>
          <Container>{content}</Container>
        </Stack>
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
