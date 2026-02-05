import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { Button, Collapse, CSSProperties, Typography } from '@mui/material'
import Alert, { AlertProps } from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import { useEffect, useRef, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import Link from 'src/Link'

type PartialLinkMessageAlertProps =
  | {
      linkText: string
      href: string
    }
  | {
      linkText?: never
      href?: never
    }

type PartialButtonMessageAlertProps =
  | {
      buttonText: string
      buttonAction: () => void
    }
  | {
      buttonText?: never
      buttonAction?: never
    }

type MessageAlertProps = {
  message?: string
  subHeading?: string
  id?: string
  code?: number
  status?: number
  severity?: AlertProps['severity']
  'data-test'?: string
  slimView?: boolean
  style?: CSSProperties
  disableScrollToView?: boolean
} & PartialLinkMessageAlertProps &
  PartialButtonMessageAlertProps

export default function MessageAlert({
  message = '',
  subHeading = '',
  id = '',
  code = -1,
  status = -1,
  severity,
  linkText,
  href,
  style,
  buttonText,
  buttonAction,
  'data-test': dataTest,
  slimView = false,
  disableScrollToView = false,
}: MessageAlertProps) {
  const alertRef = useRef<HTMLDivElement>(null)
  const [showContactMessage, setShowContactMessage] = useState(false)

  let statusCode = -1
  if (code > 0) {
    statusCode = code
  }
  if (status > 0) {
    statusCode = status
  }

  useEffect(() => {
    if (!disableScrollToView && message && alertRef.current && alertRef.current.scrollIntoView) {
      alertRef.current.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }, [message, disableScrollToView])

  const handleContact = () => {
    setShowContactMessage(!showContactMessage)
  }

  const displayButton = buttonText && buttonAction

  if (!message) {
    return null
  }

  return (
    <Alert
      severity={severity ? severity : 'info'}
      sx={{
        my: 2,
        maxHeight: slimView ? '70px' : 'none',
        maxWidth: slimView ? '250px' : 'none',
        ...style,
      }}
      ref={alertRef}
      data-test={dataTest}
      action={
        displayButton && (
          <Button size='small' onClick={buttonAction}>
            {buttonText}
          </Button>
        )
      }
    >
      <Stack spacing={1}>
        <Stack direction='row' spacing={1} alignItems='center'>
          {id && <Typography fontWeight='bold'>{id}</Typography>}
          {statusCode > 0 && <Typography fontWeight='bold'>{statusCode}</Typography>}
          <Stack>
            <Typography>{message}</Typography>
            <Typography fontWeight='bold' variant='caption'>
              {subHeading}
            </Typography>
          </Stack>
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
