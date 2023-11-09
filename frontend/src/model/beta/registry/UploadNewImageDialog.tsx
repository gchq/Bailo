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
import shellEscape from 'shell-escape'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import CodeLine from 'src/model/beta/registry/CodeLine'
import { ModelInterface } from 'types/v2/types'
import { getErrorMessage } from 'utils/fetcher'

interface UploadModelImageDialogProps {
  open: boolean
  handleClose: () => void
  model: ModelInterface
}

export default function UploadModelImageDialog({ open, handleClose, model }: UploadModelImageDialogProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  const theme = useTheme()

  const [displayToken, setDisplayToken] = useState(false)
  const [displayedToken, setDisplayedToken] = useState('')
  const [tokenErrorText, setTokenErrorText] = useState('')

  const regenerateToken = async () => {
    const res = await fetch('/api/v1/user/token', {
      method: 'POST',
    })

    if (!res.ok) {
      setTokenErrorText(await getErrorMessage(res))
      return
    }

    let token

    try {
      const body = await res.json()
      token = body.token
    } catch (error) {
      setTokenErrorText('Recieved invalid response from server.')
    }

    return token
  }

  const showToken = async () => {
    const token = await regenerateToken()
    setDisplayedToken(token)
    setDisplayToken(true)
  }

  const copyTokenOnClick = async () => {
    const token = await regenerateToken()
    if (token) {
      setDisplayedToken(token)
      navigator.clipboard.writeText(token)
    }
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
          <DialogTitle color='primary'>Pushing an Image for this Model</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography fontWeight='bold'>User authentication token</Typography>
              <Typography>Use the token below to authenticate when you try and run the docker login command</Typography>
              <Stack direction='row'>
                <Button sx={{ mr: 2 }} variant='outlined' onClick={showToken} data-test='showTokenButton'>
                  Regenerate Token
                </Button>
                <Box
                  sx={{
                    backgroundColor: theme.palette.container.main,
                    px: 2,
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
                  <IconButton onClick={copyTokenOnClick} aria-label='regenerate token and copy to clipboard'>
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant='caption' color={theme.palette.error.main}>
                {tokenErrorText}
              </Typography>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Logging in</Typography>
                <Stack spacing={2}>
                  <CodeLine line={`docker login ${uiConfig.registry.host} -u ${shellEscape([currentUser.id])}`} />
                </Stack>
              </Stack>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Pushing an image to the registry</Typography>
                <Stack spacing={2}>
                  <CodeLine line={`docker tag <image> ${window.location.host}/${model.id}/<name>:<tag>`} />
                  <CodeLine line={`docker push ${window.location.host}/${model.id}/<name>:<tag>`} />
                </Stack>
              </Stack>
            </Stack>
          </DialogContent>
          <Box sx={{ mx: 3 }}>
            <Divider />
          </Box>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose}>Cancel</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}
