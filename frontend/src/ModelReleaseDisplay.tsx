import { Box, Divider, Grid, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import Link from './Link'

export default function ModelReleaseDisplay({ release }: { release: any }) {
  const theme = useTheme()

  function formatDate(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }

  return (
    <>
      <Grid container direction='row' justifyContent='flex-start' alignItems='center'>
        <Grid item sm={4} xs={12}>
          <Stack>
            <Typography sx={{ fontWeight: 'bold' }}>{formatDate(release.timestamp)}</Typography>
            <Typography>Joe Blogs</Typography>
            <Link href='/beta'>Model Card</Link>
          </Stack>
        </Grid>
        <Grid item sm={8} xs={12}>
          <Box sx={{ border: 'solid 2px', borderRadius: 4, padding: 4, borderColor: theme.palette.primary.main }}>
            <Stack spacing={2}>
              <Typography variant='h6' color='primary'>
                {release.name}
              </Typography>
              <Typography variant='caption'>{release.notes}</Typography>
              <Divider />
              <Stack spacing={0}>
                {release.files.map((file) => (
                  <Stack key={file.name} direction='row' justifyContent='space-between' alignItems='center' spacing={2}>
                    <Link href='/beta'>{file.name}</Link>
                    <Typography variant='caption'>{file.size}</Typography>
                  </Stack>
                ))}
                {release.images.map((image) => (
                  <Stack key={image.ref} direction='row' justifyContent='space-between' alignItems='center' spacing={2}>
                    <Link href='/beta'>{image.ref}</Link>
                    <Typography variant='caption'>{image.size}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </>
  )
}
