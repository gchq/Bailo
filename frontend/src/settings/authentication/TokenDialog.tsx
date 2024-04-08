import { Visibility, VisibilityOff } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import CopyToClipboardButton from 'src/common/CopyToClipboardButton'
import MessageAlert from 'src/MessageAlert'
import { TokenInterface } from 'types/types'

type TokenDialogProps = {
  token?: TokenInterface
}

export default function TokenDialog({ token }: TokenDialogProps) {
  const theme = useTheme()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showAccessKey, setShowAccessKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)

  useEffect(() => {
    if (token) setOpen(true)
  }, [token])

  const handleClose = () => {
    setIsLoading(true)
    router.push('/settings?tab=authentication&category=personal')
  }

  const handleToggleAccessKeyVisibility = () => {
    setShowAccessKey(!showAccessKey)
  }

  const handleToggleSecretKeyVisibility = () => {
    setShowSecretKey(!showSecretKey)
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Token Created</DialogTitle>
      <DialogContent>
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
            <CopyToClipboardButton
              textToCopy={token ? token.accessKey : ''}
              notificationText='Copied access key to clipboard'
              ariaLabel='copy access key to clipboard'
            />
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
            <CopyToClipboardButton
              textToCopy={token && token.secretKey ? token.secretKey : ''}
              notificationText='Copied secret key to clipboard'
              ariaLabel='copy secret key to clipboard'
            />
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
      </DialogContent>
      <DialogActions>
        <LoadingButton variant='contained' loading={isLoading} onClick={handleClose}>
          Continue
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}
