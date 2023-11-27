import { GppBad } from '@mui/icons-material'
import { Button, Stack, Typography } from '@mui/material'
import Link from 'src/Link'

interface ForbiddenProps {
  errorMessage?: string
}

export default function Forbidden({ errorMessage }: ForbiddenProps) {
  return (
    <>
      <Stack spacing={2} alignItems='center' sx={{ pt: 2 }}>
        <GppBad color='secondary' sx={{ fontSize: 75 }} />
        <Typography component='h3' variant='h5' color='primary' fontWeight='bold'>
          Uh oh! Looks like you don&apos;t have permission to view this content.
        </Typography>
        <Typography>{errorMessage}</Typography>
        <Link href='/'>
          <Button>Click here to go back to the main page</Button>
        </Link>
      </Stack>
    </>
  )
}
