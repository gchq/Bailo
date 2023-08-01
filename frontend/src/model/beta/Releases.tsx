import { Box, Button, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import { useGetReleasesForModelId } from '../../../actions/release'
import { ModelInterface } from '../../../types/types'
import EmptyBlob from '../../common/EmptyBlob'
import Loading from '../../common/Loading'
import DraftNewReleaseDialog from '../DraftNewReleaseDialog'
import ModelReleaseDisplay from '../ModelReleaseDisplay'

export default function Releases({ model }: { model: ModelInterface }) {
  const [latestRelease, setLatestRelease] = useState<string>('')
  const [openDraftNewRelease, setOpenDraftNewRelease] = useState(false)

  const { releases, isReleasesLoading } = useGetReleasesForModelId(model.id)

  useEffect(() => {
    if (model && releases) {
      const sortedReleases = releases.sort((a, b) => (a.semver < b.semver ? 1 : b.semver > a.semver ? -1 : 0))
      setLatestRelease(sortedReleases[0].semver)
    }
  }, [model, releases])

  function handleDraftNewReleaseClose() {
    setOpenDraftNewRelease(false)
  }

  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', my: 4 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <Button variant='outlined' onClick={() => setOpenDraftNewRelease(true)}>
            Draft new Release
          </Button>
        </Box>
        {isReleasesLoading && <Loading />}

        {releases && releases.length === 0 && <EmptyBlob text={`No releases found for model ${model.name}`} />}

        {releases &&
          releases
            .sort((a, b) => (a.semver < b.semver ? 1 : b.semver > a.semver ? -1 : 0))
            .map((release) => {
              return (
                release.name && (
                  <ModelReleaseDisplay
                    key={release.semver}
                    modelId={model.id}
                    release={release}
                    latestRelease={latestRelease}
                  />
                )
              )
            })}
      </Stack>
      <DraftNewReleaseDialog open={openDraftNewRelease} handleClose={handleDraftNewReleaseClose} modelId={model.id} />
    </Box>
  )
}
