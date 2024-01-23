import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Alert, { AlertProps } from '@mui/material/Alert'
import ButtonBase from '@mui/material/ButtonBase'
import Collapse from '@mui/material/Collapse'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import copy from 'copy-to-clipboard'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import useNotification from '../src/common/Snackbar'

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
  const [contact, setContact] = useState(false)
  const alertRef = useRef<HTMLDivElement>(null)

  const sendNotification = useNotification()

  useEffect(() => {
    if (message && alertRef.current && alertRef.current.scrollIntoView) {
      alertRef.current.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }, [message])

  if (!message) return null

  const handleContact = () => {
    setContact(!contact)
  }

  const copyErrorMsgToClipboard = () => {
    copy(message)
    sendNotification({ variant: 'success', msg: 'Copied error message to clipboard' })
  }

  return (
    <Alert severity={severity} sx={{ mb: 2, mt: 2 }} ref={alertRef}>
      <Stack direction='row' spacing={1}>
        <Typography>{message}</Typography>
        <ContentCopyIcon
          fontSize='small'
          style={{
            cursor: 'pointer',
          }}
          onClick={copyErrorMsgToClipboard}
        />
        <Typography>{!!(href && linkText) && <Link href={href}>{linkText}</Link>}</Typography>
      </Stack>
      <ButtonBase onClick={handleContact}>Contact us</ButtonBase>
      <Collapse in={contact} timeout='auto' unmountOnExit>
        <Typography>
          If you are having trouble with this error. Please copy the error message and report it to the{' '}
          <Link href={'/beta/help'}>support team.</Link>
        </Typography>
      </Collapse>
    </Alert>
  )
}
