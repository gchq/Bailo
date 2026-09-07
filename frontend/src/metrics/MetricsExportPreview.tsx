import { Container } from '@mui/material'
import { ReactElement } from 'react'
import ExportPreviewDialog from 'src/common/ExportPreviewDialog'

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
  return (
    <ExportPreviewDialog
      open={open}
      setOpen={setOpen}
      documentTitle={exportDocumentTitle}
      maxWidth='lg'
      titleColor='primary'
    >
      <Container>{content}</Container>
    </ExportPreviewDialog>
  )
}
