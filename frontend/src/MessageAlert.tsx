import { Typography } from '@mui/material'
import Alert, { AlertProps } from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Link from 'next/link'

type MessageAlertProps = {
  message?: string
  severity?: AlertProps['severity']
  linkText?: string
  href?: string
}

export default function MessageAlert({ message, severity, linkText, href }: MessageAlertProps) {
  if (!message) return null

  return (
    <Alert severity={severity} sx={{ mb: 2, mt: 2 }}>
      <Stack direction='row' spacing={1}>
        <Typography>{message}</Typography>
        <Typography>{!!(href && linkText) && <Link href={href}>{linkText}</Link>}</Typography>
      </Stack>
    </Alert>
  )
}
