import { Box, Button, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import DraftNewReleaseDialog from '../DraftNewReleaseDialog'
import ModelReleaseDisplay from '../ModelReleaseDisplay'

export default function Releases({ model }: { model: any }) {
  const [latestRelease, setLatestRelease] = useState<string>('')
  const [openDraftNewRelease, setOpenDraftNewRelease] = useState(false)

  useEffect(() => {
    if (model && model.releases) {
      setLatestRelease(model.releases.sort((a, b) => a.semver < b.semver)[0].semver)
    }
  }, [model])

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

        {model.releases.map((release) => {
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
      <DraftNewReleaseDialog open={openDraftNewRelease} handleClose={handleDraftNewReleaseClose} />
    </Box>
  )
}
