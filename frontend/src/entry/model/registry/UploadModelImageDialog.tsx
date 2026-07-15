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
import { useGetCurrentUser } from 'actions/user'
import { useContext } from 'react'
import Loading from 'src/common/Loading'
import { Transition } from 'src/common/Transition'
import UiConfigContext from 'src/contexts/uiConfigContext'
import CodeLine from 'src/entry/model/registry/CodeLine'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

interface UploadModelImageDialogProps {
  open: boolean
  handleClose: () => void
  model: EntryInterface
}

export default function UploadModelImageDialog({ open, handleClose, model }: UploadModelImageDialogProps) {
  const uiConfig = useContext(UiConfigContext)
  const { currentUser, isCurrentUserLoading, isCurrentUserError } = useGetCurrentUser()

  if (isCurrentUserError) {
    return <MessageAlert message={isCurrentUserError.info.message} severity='error' />
  }

  return (
    <>
      {isCurrentUserLoading && <Loading />}
      {currentUser && (
        <Dialog open={open} onClose={handleClose} slots={{ transition: Transition }}>
          <DialogTitle color='primary'>Pushing an Image for this Model</DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography
                sx={{
                  fontWeight: 'bold',
                }}
              >
                User authentication tokens
              </Typography>
              <Typography>
                User tokens can be managed in your user settings. Use these tokens to authenticate when you run the
                docker login command.
              </Typography>
              <Box
                sx={{
                  mb: 1,
                }}
              >
                <Link href={'/settings?tab=authentication'}>Manage user tokens</Link>
              </Box>
              <Stack spacing={1}>
                <Typography
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  Logging in
                </Typography>
                <Stack spacing={2}>
                  <CodeLine line={`docker login ${uiConfig.registry.host} -u <accessKey>`} />
                </Stack>
              </Stack>
              <Stack spacing={1}>
                <Typography
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  Pushing an image to the registry
                </Typography>
                <Stack spacing={2}>
                  <CodeLine line={`docker tag <image> ${uiConfig.registry.host}/${model.id}/<name>:<tag>`} />
                  <CodeLine line={`docker push ${uiConfig.registry.host}/${model.id}/<name>:<tag>`} />
                </Stack>
              </Stack>
            </Stack>
          </DialogContent>
          <Box
            sx={{
              mx: 3,
            }}
          >
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
