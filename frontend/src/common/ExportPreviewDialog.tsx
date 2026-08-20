import { Button, Dialog, DialogActions, DialogContent, Divider, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import Image from 'next/image'
import logo from 'public/horizontal-dark.png'
import { ReactNode, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Transition } from 'src/common/Transition'

type ExportPreviewDialogProps = {
  open: boolean
  setOpen: (isOpen: boolean) => void
  documentTitle: string
  children: ReactNode
  maxWidth?: 'md' | 'lg'
  titleColor?: string
}

export default function ExportPreviewDialog({
  open,
  setOpen,
  documentTitle,
  children,
  maxWidth = 'md',
  titleColor,
}: ExportPreviewDialogProps) {
  const theme = useTheme()
  const contentRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: documentTitle.replace(' ', '_'),
  })

  const handleExportOnClick = () => {
    if (contentRef) {
      handlePrint()
    }
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth={maxWidth} slots={{ transition: Transition }}>
      <DialogContent ref={contentRef}>
        <Stack spacing={2} divider={<Divider />}>
          <Stack direction='row' sx={{ alignItems: 'center' }}>
            <Image src={logo} alt='bailo logo' width={180} height={70} />
            <Typography
              variant='h4'
              component='h1'
              color={titleColor ?? theme.palette.secondary.main}
              sx={{ fontWeight: 'bold', pl: 1 }}
            >
              {documentTitle}
            </Typography>
          </Stack>
          {children}
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
