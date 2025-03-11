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
import { useGetReleasesForModelId } from 'actions/release'
import { useEffect, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, isFileInterface } from 'types/types'
import { sortByCreatedAtDescending } from 'utils/arrayUtils'
import { formatDateString } from 'utils/dateUtils'

type AssociatedReleasesDialogProps = {
  modelId: string
  file: FileInterface | File
  open: boolean
  onClose: () => void
}

export default function AssociatedReleasesDialog({ modelId, file, open, onClose }: AssociatedReleasesDialogProps) {
  const { releases, isReleasesLoading, isReleasesError } = useGetReleasesForModelId(modelId)
  const { model, isModelLoading, isModelError } = useGetModel(modelId, 'model')
  const [latestRelease, setLatestRelease] = useState('')

  const sortedAssociatedReleases = useMemo(
    () =>
      releases
        .filter((release) => isFileInterface(file) && release.fileIds.includes(file._id))
        .sort(sortByCreatedAtDescending),
    [file, releases],
  )

  useEffect(() => {
    if (model && releases.length > 0) {
      setLatestRelease(sortedAssociatedReleases[0].semver)
    }
  }, [model, releases, sortedAssociatedReleases])

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
                        <Typography
                          color='primary'
                          component='span'
                        >{`${model.name} - ${associatedRelease.semver}`}</Typography>
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

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  return (
    <Dialog fullWidth open={open} onClose={onClose} maxWidth='md'>
      <DialogTitle>Associated Releases</DialogTitle>
      <DialogContent>{isModelLoading || isReleasesLoading ? <Loading /> : associatedReleasesDisplay}</DialogContent>
      <DialogActions>
        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
