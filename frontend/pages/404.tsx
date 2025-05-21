import { SentimentVeryDissatisfied } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'src/Link'

export default function NotFound() {
  const [errorMessage, setErrorMessage] = useState(`Hmm... We're having trouble finding this page.`)

  const router = useRouter()
  const { kind }: { kind?: string } = router.query

  useEffect(() => {
    if (kind) {
      switch (kind) {
        case 'file':
          setErrorMessage(
            'There was a problem retrieving this file. If you suspect that this is in error please contact the system administrators.',
          )
          break
        default:
          break
      }
    }
  }, [kind, setErrorMessage])

  return (
    <Stack sx={{ height: '100vh' }} justifyContent='center' alignItems='center'>
      <Box sx={{ m: 5, p: 2, width: 'fit-content' }}>
        <Stack spacing={2} alignItems='center'>
          <Stack direction='row' justifyContent='center' alignItems='center' spacing={2}>
            <SentimentVeryDissatisfied color='secondary' sx={{ fontSize: 75 }} />
            <Typography color='secondary' sx={{ fontSize: 75 }}>
              404
            </Typography>
          </Stack>
          <Typography component='h3' variant='h5' color='primary' fontWeight='bold'>
            {errorMessage}
            {/* {router.he ? errorMessage : `Hmm... We're having trouble finding this page.`} */}
          </Typography>
          <Link href='/'>
            <Button>Click here to go back to the main page</Button>
          </Link>
        </Stack>
      </Box>
    </Stack>
  )
}
