import { Dialog, DialogContent, DialogTitle, Stack } from '@mui/material'
import { useGetModel } from 'actions/model'
import { useGetReleasesForModelId } from 'actions/release'
import { useEffect, useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Loading from 'src/common/Loading'
import ReleaseDisplay from 'src/entry/model/releases/ReleaseDisplay'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, isFileInterface, ReleaseInterface } from 'types/types'

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

  const associatedReleasesDisplay = useMemo(
    () =>
      sortAssociatedReleases.map((associatedRelease) => (
        <Stack key={associatedRelease._id} spacing={1} p={2}>
          <ReleaseDisplay
            key={associatedRelease.semver}
            model={model!}
            release={associatedRelease}
            latestRelease={latestRelease}
            hideReviewBanner={true}
            hideFileDownloads={true}
          />
        </Stack>
      )),
    [latestRelease, model, sortAssociatedReleases],
  )

  useEffect(() => {
    if (model && releases.length > 0) {
      setLatestRelease(releases[0].semver)
    }
  }, [model, releases])

  if (isReleasesError) return <MessageAlert message={isReleasesError.info.message} severity='error' />

  if (isModelError) return <MessageAlert message={isModelError.info.message} severity='error' />

  if (isReleasesLoading) return <Loading />

  if (isModelLoading) return <Loading />

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Releases associated to {file.name}</DialogTitle>
      <DialogContent>
        {associatedReleases.length > 0 ? associatedReleasesDisplay : <EmptyBlob text='No Associated Releases' />}
      </DialogContent>
    </Dialog>
  )
}
