import { Visibility, VisibilityOff } from '@mui/icons-material'
import { Box, Grid2, IconButton, Tooltip, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import { TokenInterface } from 'types/types'
import { HIDDEN_TOKEN_ACCESS_KEY, HIDDEN_TOKEN_SECRET_KEY } from 'utils/constants'

type PersonalAccessTokenProps = {
  token: TokenInterface
}

export default function PersonalAccessToken({ token }: PersonalAccessTokenProps) {
  const theme = useTheme()
  const [showAccessKey, setShowAccessKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  const handleToggleAccessKeyVisibility = () => {
    setShowAccessKey(!showAccessKey)
  }

  const handleToggleSecretKeyVisibility = () => {
    setShowSecretKey(!showSecretKey)
  }

  return (
    <>
      <Grid2 container spacing={1} alignItems='center'>
        <Grid2 size={{ xs: 2 }}>
          <Typography>Access Key</Typography>
        </Grid2>
        <Grid2 size={{ xs: 8 }}>
          <Box
            sx={{
              backgroundColor: theme.palette.container.main,
              px: 2,
              py: 1,
              display: 'flex',
            }}
          >
            <Typography sx={{ mx: 'auto' }} data-test='accessKeyText'>
              {showAccessKey ? token.accessKey || '' : HIDDEN_TOKEN_ACCESS_KEY}
            </Typography>
          </Box>
        </Grid2>
        <Grid2 size={{ xs: 2 }}>
          <CopyToClipboardButton
            textToCopy={token.accessKey}
            notificationText='Copied access key to clipboard'
            ariaLabel='copy access key to clipboard'
          />
          <Tooltip title={`${showAccessKey ? 'Hide' : 'Show'} access key`} placement='top'>
            <IconButton
              color='primary'
              onClick={handleToggleAccessKeyVisibility}
              aria-label={`${showAccessKey ? 'Hide' : 'Show'} access key`}
              data-test='toggleAccessKeyButton'
            >
              {showAccessKey ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
        </Grid2>
        <Grid2 size={{ xs: 2 }}>
          <Typography>Secret Key</Typography>
        </Grid2>
        <Grid2 size={{ xs: 8 }}>
          <Box
            sx={{
              backgroundColor: theme.palette.container.main,
              px: 2,
              py: 1,
              display: 'flex',
            }}
          >
            <Typography sx={{ mx: 'auto' }} data-test='secretKeyText'>
              {showSecretKey ? token.secretKey : HIDDEN_TOKEN_SECRET_KEY}
            </Typography>
          </Box>
        </Grid2>
        <Grid2 size={{ xs: 2 }}>
          <CopyToClipboardButton
            textToCopy={token.secretKey}
            notificationText='Copied secret key to clipboard'
            ariaLabel='copy secret key to clipboard'
          />
          <Tooltip title={`${showSecretKey ? 'Hide' : 'Show'} secret key`}>
            <IconButton
              color='primary'
              onClick={handleToggleSecretKeyVisibility}
              aria-label={`${showSecretKey ? 'Hide' : 'Show'} secret key`}
              data-test='toggleSecretKeyButton'
            >
              {showSecretKey ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Tooltip>
        </Grid2>
      </Grid2>
    </>
  )
}
