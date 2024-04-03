import { ContentCopy } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'
import useNotification from 'src/hooks/useNotification'

interface CopyToClipboardButtonProps {
  textToCopy: string
  notificationText?: string
  ariaLabel?: string
}

export default function CopyToClipboardButton({
  textToCopy,
  notificationText = 'Copied to clipbord',
  ariaLabel = 'Copy to clipboard',
}: CopyToClipboardButtonProps) {
  const sendNotification = useNotification()

  const copyTextToClipboard = () => {
    navigator.clipboard.writeText(textToCopy)
    sendNotification({ variant: 'success', msg: notificationText })
  }

  return (
    <Tooltip title='Copy to clipboard'>
      <IconButton size='small' color='primary' onClick={copyTextToClipboard} aria-label={ariaLabel}>
        <ContentCopy fontSize='inherit' />
      </IconButton>
    </Tooltip>
  )
}
