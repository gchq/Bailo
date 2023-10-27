import { LoadingButton } from '@mui/lab'
import { Box, Stack } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

import { useGetReleasesForModelId } from '../../../actions/release'
import { ModelInterface } from '../../../types/v2/types'
import EmptyBlob from '../../common/EmptyBlob'
import Loading from '../../common/Loading'
import DraftNewReleaseDialog from './releases/DraftNewReleaseDialog'
import ModelReleaseDisplay from './releases/ModelReleaseDisplay'

export default function Releases({ model }: { model: ModelInterface }) {
  const [latestRelease, setLatestRelease] = useState<string>('')
  const [openDraftNewRelease, setOpenDraftNewRelease] = useState(false)
  const [loading, setLoading] = useState(false)
  const { releases, isReleasesLoading, mutateReleases } = useGetReleasesForModelId(model.id)

  const modelReleaseDisplays = useMemo(
    () =>
      releases.map((release) => (
        <ModelReleaseDisplay key={release.semver} modelId={model.id} release={release} latestRelease={latestRelease} />
      )),
    [latestRelease, model.id, releases],
  )

  useEffect(() => {
    if (model && releases.length > 0) {
      setLatestRelease(releases[0].semver)
    }
  }, [model, releases])

  function handleDraftNewReleaseClose() {
    setOpenDraftNewRelease(false)
    setLoading(false)
  }

  function handleButtonClick() {
    setOpenDraftNewRelease(true)
    setLoading(true)
  }
  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', my: 4 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <LoadingButton variant='outlined' onClick={handleButtonClick} loading={loading} disabled={!model.card}>
            Draft new Release
          </LoadingButton>
        </Box>
        {isReleasesLoading && <Loading />}
        {releases.length === 0 && <EmptyBlob text={`No releases found for model ${model.name}`} />}
        {modelReleaseDisplays}
      </Stack>
      <DraftNewReleaseDialog
        open={openDraftNewRelease}
        handleClose={handleDraftNewReleaseClose}
        model={model}
        mutateReleases={mutateReleases}
      />
    </Box>
  )
}
