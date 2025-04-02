import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import { useGetModel } from 'actions/model'
import { useMemo } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import { Transition } from 'src/common/Transition'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, isFileInterface, ReleaseInterface } from 'types/types'
import { formatDateString } from 'utils/dateUtils'

type AssociatedReleasesDialogProps = {
  modelId: string
  file: FileInterface | File
  sortedAssociatedReleases: Array<ReleaseInterface>
  latestRelease: string
  open: boolean
  onClose: () => void
}

export default function AssociatedReleasesDialog({
  modelId,
  file,
  sortedAssociatedReleases,
  latestRelease,
  open,
  onClose,
}: AssociatedReleasesDialogProps) {
  const { model, isModelLoading, isModelError } = useGetModel(modelId, 'model')

  const associatedReleasesDisplay = useMemo(
    () =>
      model && isFileInterface(file) && sortedAssociatedReleases.length > 0 ? (
        <List disablePadding>
          {sortedAssociatedReleases.map((associatedRelease) => (
            <ListItem disablePadding key={associatedRelease._id}>
              <Link
                href={`/model/${model.id}/release/${associatedRelease.semver}`}
                sx={{ textDecoration: 'none', width: '100%' }}
              >
                <ListItemButton dense>
                  <ListItemText
                    primary={
                      <>
                        <Typography color='primary' component='span'>
                          {associatedRelease.semver}
                        </Typography>
                        {latestRelease === associatedRelease.semver && (
                          <Typography color='secondary' component='span' pl={1}>
                            (Latest)
                          </Typography>
                        )}
                      </>
                    }
                    secondary={formatDateString(file.createdAt.toString())}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
        </List>
      ) : (
        <EmptyBlob text='No Associated Releases' />
      ),
    [file, latestRelease, model, sortedAssociatedReleases],
  )

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth='sm' slots={{ transition: Transition }}>
      <DialogTitle>Associated Releases</DialogTitle>
      <DialogContent>{isModelLoading ? <Loading /> : associatedReleasesDisplay}</DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
