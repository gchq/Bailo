import { ContentCopy, Visibility, VisibilityOff } from '@mui/icons-material'
import { Box, Grid, IconButton, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { TokenInterface } from 'types/types'

type PersonalAccessTokenProps = {
  token: TokenInterface
}

export default function PersonalAccessToken({ token }: PersonalAccessTokenProps) {
  const theme = useTheme()
  const [errorMessage, setErrorMessage] = useState('')
  const [showAccessKey, setShowAccessKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const sendNotification = useNotification()

  const handleCopyAccessKey = async () => {
    if (token) {
      setErrorMessage('')
      await navigator.clipboard.writeText(token.accessKey)
      sendNotification({
        variant: 'success',
        msg: 'Access key copied to clipboard',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    } else {
      setErrorMessage('Failed to copy Access Key to clipboard')
    }
  }

  const handleCopySecretKey = async () => {
    if (token.secretKey) {
      setErrorMessage('')
      await navigator.clipboard.writeText(token.secretKey)
      sendNotification({
        variant: 'success',
        msg: 'Secret key copied to clipboard',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    } else {
      setErrorMessage('Failed to copy Secret Key to clipboard')
    }
  }

  const handleToggleAccessKeyVisibility = () => {
    setShowAccessKey(!showAccessKey)
  }

  const handleToggleSecretKeyVisibility = () => {
    setShowSecretKey(!showSecretKey)
  }

  return (
    <>
      <MessageAlert
        message='You will never be able to access this token again. Make sure to copy it to a safe place.'
        severity='warning'
      />
      <Grid container spacing={1} alignItems='center'>
        <Grid item xs={2}>
          <Typography>Access Key</Typography>
        </Grid>
        <Grid item xs={8}>
          <Box
            sx={{
              backgroundColor: theme.palette.container.main,
              px: 2,
              py: 1,
              display: 'flex',
            }}
          >
            <Typography sx={{ mx: 'auto' }} data-test='accessKeyText'>
              {showAccessKey ? token?.accessKey || '' : 'xxxxxxxxxx'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={2}>
          <Tooltip title='Copy to clipboard' placement='top'>
            <IconButton onClick={handleCopyAccessKey} aria-label='copy access key to clipboard'>
              <ContentCopy />
            </IconButton>
          </Tooltip>
          <Tooltip title={`${showAccessKey ? 'Hide' : 'Show'} access key`} placement='top'>
            <IconButton
              onClick={handleToggleAccessKeyVisibility}
              aria-label={`${showAccessKey ? 'Hide' : 'Show'} access key`}
              data-test='toggleAccessKeyButton'
            >
              {showAccessKey ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid item xs={2}>
          <Typography>Secret Key</Typography>
        </Grid>
        <Grid item xs={8}>
          <Box
            sx={{
              backgroundColor: theme.palette.container.main,
              px: 2,
              py: 1,
              display: 'flex',
            }}
          >
            <Typography sx={{ mx: 'auto' }} data-test='secretKeyText'>
              {showSecretKey ? token?.secretKey || '' : 'xxxxxxxxxxxxxxxxxxxxx'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={2}>
          <Tooltip title='Copy to clipboard'>
            <IconButton onClick={handleCopySecretKey} aria-label='copy secret key to clipboard'>
              <ContentCopy />
            </IconButton>
          </Tooltip>
          <Tooltip title={`${showSecretKey ? 'Hide' : 'Show'} secret key`}>
            <IconButton
              onClick={handleToggleSecretKeyVisibility}
              aria-label={`${showSecretKey ? 'Hide' : 'Show'} secret key`}
              data-test='toggleSecretKeyButton'
            >
              {showSecretKey ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
      <MessageAlert message={errorMessage} severity='error' />
    </>
  )
}
