import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { Button, Collapse, Typography } from '@mui/material'
import Alert, { AlertProps } from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import { useEffect, useRef, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Link from 'src/Link'

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
  slimView?: boolean
} & PartialMessageAlertProps

export default function MessageAlert({
  message = '',
  severity,
  linkText,
  href,
  'data-test': dataTest,
  slimView = false,
}: MessageAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null)
  const [showContactMessage, setShowContactMessage] = useState(false)

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

  if (!message) return null

  return (
    <Alert
      severity={severity}
      sx={[
        {
          my: 2,
          maxHeight: slimView ? '70px' : 'none',
          maxWidth: slimView ? '250px' : 'none',
        },
      ]}
      ref={alertRef}
      data-test={dataTest}
    >
      <Stack spacing={1}>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Typography>{message}</Typography>
          {severity === 'error' && (
            <CopyToClipboardButton
              textToCopy={message}
              notificationText='Copied error message to clipboard'
              ariaLabel='copy error message to clipboard'
            />
          )}
        </Stack>
        {!!(href && linkText) && (
          <Typography>
            <Link href={href}>{linkText}</Link>
          </Typography>
        )}
        {severity === 'error' && !slimView && (
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
