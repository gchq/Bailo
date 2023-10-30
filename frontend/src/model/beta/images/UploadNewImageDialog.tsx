import ContentCopy from '@mui/icons-material/ContentCopy'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useGetUiConfig } from 'actions/uiConfig'
import { useGetCurrentUser } from 'actions/user'
import { useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import CodeLine from 'src/model/beta/images/CodeLine'

interface UploadModelImageDialogProps {
  open: boolean
  handleClose: () => void
}

export default function UploadModelImageDialog({ open, handleClose }: UploadModelImageDialogProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const theme = useTheme()

  const [displayToken, setDisplayToken] = useState(false)
  const [displayedToken, setDisplayedToken] = useState('')

  const regenerateToken = async () => {
    const { token } = await fetch('/api/v1/user/token', {
      method: 'POST',
    }).then((res) => res.json())

    return token
  }

  const showToken = async () => {
    const token = await regenerateToken()
    setDisplayedToken(token)
    setDisplayToken(true)
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {(isUiConfigLoading || isCurrentUserLoading) && <Loading />}
      {uiConfig && currentUser && (
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle color='primary'>Uploading an Image for this Model</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography fontWeight='bold'>User authentication token</Typography>
              <Typography>
                Use the token below to authenticate when you try and run the dockiner login command
              </Typography>
              <Stack direction='row'>
                <Button sx={{ mr: 2 }} variant='outlined' onClick={showToken} data-test='showTokenButton'>
                  Regenerate Token
                </Button>
                <Box
                  sx={{
                    backgroundColor: theme.palette.container.main,
                    pr: 2,
                    pl: 2,
                    display: 'flex',
                    mr: 1,
                  }}
                >
                  <Box component={Stack} direction='column' justifyContent='center'>
                    <Typography variant='body1' data-test='dockerPassword'>
                      {displayToken ? displayedToken : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxx'}
                    </Typography>
                  </Box>
                </Box>
                <Tooltip title='Regenerate & Copy to clipboard'>
                  <IconButton
                    onClick={async () => {
                      const token = await regenerateToken()
                      setDisplayedToken(token)
                      navigator.clipboard.writeText(token)
                    }}
                    aria-label='regenerate and copy to clipboard'
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Logging in</Typography>
                <Stack spacing={2}>
                  <CodeLine line={`docker login ${uiConfig.registry.host} -u ${currentUser.id}`} />
                </Stack>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Pushing an image to the registry</Typography>
                <Stack spacing={2}>
                  <CodeLine line={`docker tag <image> ${window.location.host}/<namespace>/<model>:<version>`} />
                  <CodeLine line={`docker push ${window.location.host}/<namespace>/<model>:<version>`} />
                  <CodeLine line={`${window.location.host}/api/v2/model/myModelId/images`} />
                </Stack>
              </Stack>
            </Stack>
          </DialogContent>
          <Box sx={{ mx: 3 }}>
            <Divider sx={{ margin: 'auto' }} />
          </Box>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose}>Cancel</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}
