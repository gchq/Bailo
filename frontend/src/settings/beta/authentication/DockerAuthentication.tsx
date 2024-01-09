import ContentCopy from '@mui/icons-material/ContentCopy'
import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import { getErrorMessage } from 'utils/fetcher'

export default function DockerAuthentication() {
  const theme = useTheme()
  const [showToken, setShowToken] = useState(false)
  const [token, setToken] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const regenerateToken = async () => {
    const res = await fetch('/api/v1/user/token', {
      method: 'POST',
    })

    if (!res.ok) {
      setErrorMessage(await getErrorMessage(res))
      return ''
    }

    let newToken = ''

    try {
      const body = await res.json()
      newToken = body.token
    } catch (error) {
      setErrorMessage('Received invalid response from server.')
    }

    return newToken
  }

  const handleRegenerateToken = async () => {
    const newToken = await regenerateToken()
    if (newToken) {
      setToken(newToken)
      setShowToken(true)
    }
  }

  const handleRegenerateAndCopy = async () => {
    const newToken = await regenerateToken()
    if (newToken) {
      setToken(newToken)
      navigator.clipboard.writeText(newToken)
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography fontWeight='bold' mb={1}>
        Docker user authentication token
      </Typography>
      <Stack direction='row' spacing={1}>
        <Button variant='outlined' onClick={handleRegenerateToken} data-test='regenerateTokenButton'>
          Regenerate Token
        </Button>
        <Typography
          sx={{
            backgroundColor: theme.palette.container.main,
            px: 2,
            py: 1,
          }}
          data-test='dockerPassword'
        >
          {showToken ? token : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx'}
        </Typography>
        <Tooltip title='Regenerate & copy to clipboard'>
          <IconButton onClick={handleRegenerateAndCopy} aria-label='regenerate and copy to clipboard'>
            <ContentCopy />
          </IconButton>
        </Tooltip>
      </Stack>
      <MessageAlert message={errorMessage} severity='error' />
    </Box>
  )
}
