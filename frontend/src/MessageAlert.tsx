import ContentCopy from '@mui/icons-material/ContentCopy'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { Button, Collapse, IconButton, Tooltip, Typography } from '@mui/material'
import Alert, { AlertProps } from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import useNotification from 'src/hooks/useNotification'

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
  'data-test'?: string
} & PartialMessageAlertProps

export default function MessageAlert({
  message = '',
  severity,
  linkText,
  href,
  'data-test': dataTest,
}: MessageAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null)
  const [showContactMessage, setShowContactMessage] = useState(false)
  const sendNotification = useNotification()

  useEffect(() => {
    if (message && alertRef.current && alertRef.current.scrollIntoView) {
      alertRef.current.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }, [message])

  const handleContact = () => {
    setShowContactMessage(!showContactMessage)
  }

  const copyErrorMsgToClipboard = () => {
    navigator.clipboard.writeText(message)
    sendNotification({ variant: 'success', msg: 'Copied error message to clipboard' })
  }

  if (!message) return null

  return (
    <Alert severity={severity} sx={{ mb: 2, mt: 2 }} ref={alertRef} data-test={dataTest}>
      <Stack spacing={1}>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Typography>{message}</Typography>
          {severity === 'error' && (
            <Tooltip title='Copy to clipboard'>
              <IconButton
                size='small'
                color='primary'
                onClick={copyErrorMsgToClipboard}
                aria-label='copy error message to clipboard'
              >
                <ContentCopy fontSize='inherit' />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        <Typography>{!!(href && linkText) && <Link href={href}>{linkText}</Link>}</Typography>
        {severity === 'error' && (
          <>
            <div>
              <Button
                size='small'
                onClick={handleContact}
                endIcon={showContactMessage ? <ExpandLess /> : <ExpandMore />}
              >
                Contact us
              </Button>
            </div>
            <Collapse unmountOnExit in={showContactMessage} timeout='auto'>
              <Typography>
                {'Having trouble? Please copy the error message and report it to the '}
                <Link href={'/help'}>Bailo support team</Link>.
              </Typography>
            </Collapse>
          </>
        )}
      </Stack>
    </Alert>
  )
}
