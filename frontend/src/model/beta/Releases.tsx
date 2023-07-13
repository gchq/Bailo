import { Box, Button, Stack } from '@mui/material'
import ModelReleaseDisplay from 'src/ModelReleaseDisplay'

export default function Releases({ model }: { model: any }) {
  const releases: any = [
    {
      name: 'My Model V1',
      semver: 'v1.0.1',
      timestamp: '2023-07-12T11:09:57.832+00:00',
      notes: 'This is another release',
      files: [{ name: 'myfile.tar.gz', size: '6345kb' }],
      images: [{ ref: 'dockerimage.tar.gz', size: '45mb' }],
    },
    {
      name: 'My Model V1',
      semver: 'v1.0.0',
      timestamp: '2023-07-10T11:09:57.832+00:00',
      notes: 'This is an initial release',
      files: [{ name: 'myfile.tar.gz', size: '4345kb' }],
      images: [{ ref: 'dockerimage.tar.gz', size: '43mb' }],
    },
  ]
  return (
    <Box sx={{ maxWidth: '900px', mx: 'auto', my: 4 }}>
      <Stack spacing={4}>
        <Box sx={{ textAlign: 'right' }}>
          <Button>Draft new Release</Button>
        </Box>

        {releases.map((release) => (
          <ModelReleaseDisplay key={release.name} release={release} />
        ))}
      </Stack>
    </Box>
  )
}
