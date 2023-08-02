import { Box, Button, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import { useGetReleasesForModelId } from '../../../actions/release'
import { ModelInterface, ReleaseInterface } from '../../../types/types'
import EmptyBlob from '../../common/EmptyBlob'
import Loading from '../../common/Loading'
import DraftNewReleaseDialog from '../DraftNewReleaseDialog'
import ModelReleaseDisplay from '../ModelReleaseDisplay'

export default function Releases({ model }: { model: ModelInterface }) {
  const [latestRelease, setLatestRelease] = useState<string>('')
  const [openDraftNewRelease, setOpenDraftNewRelease] = useState(false)

  const { releases, isReleasesLoading } = useGetReleasesForModelId(model.id)

  const sortByReleaseVersionDescending = (a: ReleaseInterface, b: ReleaseInterface) => {
    if (a.semver < b.semver) return 1
    if (b.semver > a.semver) return -1
    return 0
  }

  const sortedReleases = releases.sort(sortByReleaseVersionDescending)

  useEffect(() => {
    if (model && releases && sortedReleases.length > 0) {
      setLatestRelease(sortedReleases[0].semver)
    }
  }, [model, releases, sortedReleases])

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

        {releases.length === 0 && <EmptyBlob text={`No releases found for model ${model.name}`} />}

        {sortedReleases &&
          sortedReleases.map((release) => {
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
