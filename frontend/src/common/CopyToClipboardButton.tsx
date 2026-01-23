import { ContentCopy } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'
import useCopyToClipboard from 'src/hooks/useCopyToClipboard'

interface CopyToClipboardButtonProps {
  textToCopy: string
  notificationText?: string
  fallbackErrorMessage?: string
  ariaLabel?: string
}

export default function CopyToClipboardButton({
  textToCopy,
  notificationText = 'Copied to clipboard',
  fallbackErrorMessage = 'Failed to copy to clipboard',
  ariaLabel = 'Copy to clipboard',
}: CopyToClipboardButtonProps) {
  const copyToClipboard = useCopyToClipboard()

  const handleClick = () => {
    copyToClipboard(textToCopy, notificationText, fallbackErrorMessage)
  }

  return (
    <Tooltip title='Copy to clipboard'>
      <IconButton
        size='small'
        color='primary'
        onClick={handleClick}
        aria-label={ariaLabel}
        data-test='copyToClipboardButton'
      >
        <ContentCopy fontSize='inherit' />
      </IconButton>
    </Tooltip>
  )
}
