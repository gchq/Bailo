import { Box, Button, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import ModelReleaseDisplay from '../../../src/ModelReleaseDisplay'

export default function Releases({ model }: { model: any }) {
  const [latestRelease, setLatestRelease] = useState('')

  useEffect(() => {
    if (model && model.releases) {
      setLatestRelease(model.releases.sort((a, b) => a.semver < b.semver)[0].semver)
    }
  }, [model])
  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', my: 4 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <Button variant='outlined'>Draft new Release</Button>
        </Box>

        {model.releases.map((release) => {
          return (
            release.name && (
              <ModelReleaseDisplay
                key={release.semver}
                modelUuid={model.uuid}
                release={release}
                latestRelease={latestRelease}
              />
            )
          )
        })}
      </Stack>
    </Box>
  )
}
