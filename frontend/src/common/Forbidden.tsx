import { GppBad } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'
import { CSSProperties } from 'react'
import Link from 'src/Link'

interface ForbiddenProps {
  errorMessage?: string
  noMargin?: boolean
  hideNavButton?: boolean
  additionalStyling?: CSSProperties
}

export default function Forbidden({
  errorMessage = '',
  noMargin = false,
  additionalStyling,
  hideNavButton = false,
}: ForbiddenProps) {
  return (
    <Stack justifyContent='center' alignItems='center' sx={additionalStyling}>
      <Box
        sx={{
          p: 2,
          width: 'fit-content',
          m: noMargin ? 0 : 5,
        }}
      >
        <Stack spacing={2} alignItems='center' sx={{ pt: 2 }}>
          <Stack direction='row' justifyContent='center' alignItems='center' spacing={2}>
            <GppBad color='secondary' sx={{ fontSize: 75 }} />
            <Typography color='secondary' sx={{ fontSize: 75 }}>
              403
            </Typography>
          </Stack>
          <Typography component='h3' variant='h5' color='primary' fontWeight='bold'>
            Uh oh! Looks like you don&apos;t have permission to view this content.
          </Typography>
          <Typography>{errorMessage}</Typography>
          {!hideNavButton && (
            <Link href='/'>
              <Button>Click here to go back to the main page</Button>
            </Link>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
