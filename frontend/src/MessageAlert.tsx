import { Typography } from '@mui/material'
import Alert, { AlertProps } from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

type PartialMessageAlertProps =
  | {
      linkText: string
      href: string
    }
  | {
      linkText?: never
      href?: never
    }

type MessageAlertProps = {
  message?: string
  severity?: AlertProps['severity']
} & PartialMessageAlertProps

export default function MessageAlert({ message, severity, linkText, href }: MessageAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message && alertRef.current && alertRef.current.scrollIntoView) {
      alertRef.current.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }, [message])

  if (!message) return null

  return (
    <Alert severity={severity} sx={{ mb: 2, mt: 2 }} ref={alertRef}>
      <Stack direction='row' spacing={1}>
        <Typography>{message}</Typography>
        <Typography>{!!(href && linkText) && <Link href={href}>{linkText}</Link>}</Typography>
      </Stack>
    </Alert>
  )
}
