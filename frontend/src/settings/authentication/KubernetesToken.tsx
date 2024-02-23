import { ContentCopy } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import { DialogActions, DialogContent, IconButton, InputAdornment, TextField } from '@mui/material'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { ChangeEvent } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import useNotification from 'utils/hooks/useNotification'

type KubernetesInputProps = {
  value: string
  onChange: (value: string) => void
}
export default function KubernetesToken({ value, onChange }: KubernetesInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const htmlId = 'docker-input'
  const [_copied, setCopied] = useState(false)
  const sendNotification = useNotification()

  const handleClose = () => {
    setIsLoading(true)
    router.push('/settings?tab=authentication&category=docker')
  }

  const handleCopyInput = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    sendNotification({
      variant: 'success',
      msg: 'copied to clipboard',
      anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
    })
  }
  return (
    <DialogContent>
      <LabelledInput label={'Input'} htmlFor={htmlId}>
        <TextField
          id={htmlId}
          value={value}
          onChange={handleChange}
          InputProps={{
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton onClick={handleCopyInput} aria-label='copy access key to clipboard'>
                  <ContentCopy />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </LabelledInput>
      {/* <TextField id='outlined-textarea' label='Multiline Placeholder' placeholder='Placeholder' multiline /> */}
      <DialogActions>
        <LoadingButton variant='contained' loading={isLoading} onClick={handleClose}>
          Continue
        </LoadingButton>
      </DialogActions>
    </DialogContent>
  )
}
