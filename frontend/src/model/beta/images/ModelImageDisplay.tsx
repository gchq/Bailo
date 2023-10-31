import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo } from 'react'

import { ModelImage } from '../../../../types/interfaces'
import Link from '../../../Link'

type ModelImageDisplayProps = {
  modelImage: ModelImage
}

export default function ModelImageDisplay({ modelImage }: ModelImageDisplayProps) {
  const theme = useTheme()

  const modelImageVersions = useMemo(
    () =>
      modelImage.tags.map((imageVersion) => (
        <Link href='/beta' key={imageVersion}>
          {imageVersion}
        </Link>
      )),
    [modelImage],
  )

  return (
    <Box
      sx={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: theme.palette.primary.main,
        width: '100%',
        borderRadius: 4,
        p: 2,
      }}
    >
      <Stack direction='column' spacing={1}>
        <Typography component='h2' variant='h6' color='primary'>
          {modelImage.name}
        </Typography>
        <Typography fontWeight='bold'>Versions</Typography>
        {modelImageVersions}
      </Stack>
    </Box>
  )
}
