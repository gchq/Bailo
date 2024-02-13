import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useGetCurrentUser } from 'actions/user'
import Loading from 'src/common/Loading'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import CodeLine from 'src/model/registry/CodeLine'
import { ModelInterface } from 'types/v2/types'

interface UploadModelImageDialogProps {
  open: boolean
  handleClose: () => void
  model: ModelInterface
}

export default function UploadModelImageDialog({ open, handleClose, model }: UploadModelImageDialogProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

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
              <Typography fontWeight='bold'>User authentication tokens</Typography>
              <Typography>
                User tokens can be managed in your user settings. Use these tokens to authenticate when you run the
                docker login command.
              </Typography>
              <Box mb={1}>
                <Link href={'/beta/settings?tab=authentication'}>Manage user tokens</Link>
              </Box>
              <Stack spacing={1}>
                <Typography fontWeight='bold'>Logging in</Typography>
                <Stack spacing={2}>
                  <CodeLine line={`docker login ${uiConfig.registry.host} -u <accessKey>`} />
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
          <Box mx={3}>
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
