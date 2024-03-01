import { ContentCopy } from '@mui/icons-material'
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material'
import { useState } from 'react'
import useNotification from 'utils/hooks/useNotification'

type CopyInputTextProp = {
  text: string
}
export default function CopyInputTextField({ text }: CopyInputTextProp) {
  const [_copied, setCopied] = useState(false)

  const sendNotification = useNotification()

  const handleCopyInput = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    sendNotification({
      variant: 'success',
      msg: 'copied to clipboard',
      anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
    })
  }

  return (
    <TextField
      value={text}
      sx={{
        width: '500px',
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <Tooltip title='Copy to clipboard' placement='top'>
              <IconButton onClick={handleCopyInput} aria-label='copy access key to clipboard'>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
        readOnly: true,
      }}
    />
  )
}
