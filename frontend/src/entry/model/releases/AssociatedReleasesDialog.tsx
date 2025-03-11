import { Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/model'
import { useGetReleasesForModelId } from 'actions/release'
import { useCallback, useEffect, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import Link from 'src/Link'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, isFileInterface, ReleaseInterface } from 'types/types'
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

  const associatedReleases: Array<ReleaseInterface> = useMemo(
    () => releases.filter((release) => isFileInterface(file) && release.fileIds.includes(file._id)),
    [file, releases],
  )

  const sortAssociatedReleases: Array<ReleaseInterface> = associatedReleases.sort((a, b) => {
    if (a.createdAt > b.createdAt) {
      return -1
    }
    if (a.createdAt < b.createdAt) {
      return 1
    } else {
      return 0
    }
  })

  const isLatestRelease = useCallback(
    (semver: string) => {
      if (latestRelease === semver) {
        return <Typography color='secondary'>(Latest)</Typography>
      }
    },
    [latestRelease],
  )

  useEffect(() => {
    if (model && releases.length > 0) {
      setLatestRelease(releases[0].semver)
    }
  }, [model, releases])

  const associatedReleasesDisplay = useMemo(
    () =>
      model &&
      isFileInterface(file) &&
      sortAssociatedReleases.map((associatedRelease) => (
        <Stack key={associatedRelease._id} spacing={2} p={2}>
          <List>
            <ListItem secondaryAction={isLatestRelease(associatedRelease.semver)}>
              <Link noLinkStyle href={`/model/${model.id}/release/${associatedRelease.semver}`}>
                <ListItemText
                  primary={`${model.name} - ${associatedRelease.semver}`}
                  secondary={` ${formatDateString(file.createdAt.toString())}`}
                />
              </Link>
            </ListItem>
          </List>
        </Stack>
      )),
    [file, isLatestRelease, model, sortAssociatedReleases],
  )

  if (isReleasesError) {
    return <MessageAlert message={isReleasesError.info.message} severity='error' />
  }

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  if (isModelLoading || isReleasesLoading) {
    return <Loading />
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md'>
      <DialogTitle>Releases associated to {file.name}</DialogTitle>
      <DialogContent>
        {associatedReleases.length > 0 ? associatedReleasesDisplay : <EmptyBlob text='No Associated Releases' />}
      </DialogContent>
    </Dialog>
  )
}
