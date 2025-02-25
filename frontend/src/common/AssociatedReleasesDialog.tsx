import { Dialog, DialogContent, DialogTitle } from '@mui/material'
import { useGetModel } from 'actions/model'
import { useGetReleasesForModelId } from 'actions/release'
import { useEffect, useMemo, useState } from 'react'
import ReleaseDisplay from 'src/entry/model/releases/ReleaseDisplay'
import { FileInterface, isFileInterface, ReleaseInterface } from 'types/types'

type AssociatedReleasesDialogProps = {
  modelId: string
  file: FileInterface | File
  open: boolean
  onClose: () => void
}

export default function AssociatedReleasesDialog({ modelId, file, open, onClose }: AssociatedReleasesDialogProps) {
  const { releases } = useGetReleasesForModelId(modelId)
  const { model } = useGetModel(modelId, 'model')
  const [latestRelease, setLatestRelease] = useState('')

  const associatedReleases: Array<ReleaseInterface> = useMemo(
    () => releases.filter((release) => isFileInterface(file) && release.fileIds.includes(file._id)),
    [file, releases],
  )

  const associatedReleasesDisplay = useMemo(
    () =>
      associatedReleases.map((associatedRelease) => (
        <ReleaseDisplay
          key={associatedRelease.semver}
          model={model!}
          release={associatedRelease}
          latestRelease={latestRelease}
          hideReviewBanner={true}
        />
      )),
    [associatedReleases, latestRelease, model],
  )

  useEffect(() => {
    if (model && releases.length > 0) {
      setLatestRelease(releases[0].semver)
    }
  }, [model, releases])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Releases associated to {file.name}</DialogTitle>
      <DialogContent>{associatedReleases.length > 0 ? associatedReleasesDisplay : <></>}</DialogContent>
    </Dialog>
  )
}
