import { Box, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'

import { ModelImage } from '../../../../types/interfaces'
import Link from '../../../Link'

type ModelImageDisplayProps = {
  modelImage: ModelImage
}

export default function ModelImageDisplay({ modelImage }: ModelImageDisplayProps) {
  const theme = useTheme()

  return (
    <>
      <Box
        sx={{
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: theme.palette.primary.main,
          width: '100%',
          borderRadius: 4,
        }}
      >
        <Box p={2}>
          <Stack direction='column' spacing={1}>
            <Typography component='h2' variant='h6' color='primary'>
              {modelImage.model}
            </Typography>
            <Typography fontWeight='bold'>Versions</Typography>
            {modelImage.versions.map((imageVersion) => (
              <Link href='/beta' key={imageVersion}>
                {imageVersion}
              </Link>
            ))}
          </Stack>
        </Box>
      </Box>
    </>
  )
}
