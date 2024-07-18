import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Slide,
  Stack,
  Typography,
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { useGetUiConfig } from 'actions/uiConfig'
import { useGetCurrentUser } from 'actions/user'
import { forwardRef } from 'react'
import Loading from 'src/common/Loading'
import CodeLine from 'src/entry/model/registry/CodeLine'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

interface UploadModelImageDialogProps {
  open: boolean
  handleClose: () => void
  model: EntryInterface
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction='up' ref={ref} {...props} />
})

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
        <Dialog open={open} onClose={handleClose} keepMounted disableEscapeKeyDown TransitionComponent={Transition}>
          <DialogTitle color='primary'>Pushing an Image for this Model</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography fontWeight='bold'>User authentication tokens</Typography>
              <Typography>
                User tokens can be managed in your user settings. Use these tokens to authenticate when you run the
                docker login command.
              </Typography>
              <Box mb={1}>
                <Link href={'/settings?tab=authentication'}>Manage user tokens</Link>
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
