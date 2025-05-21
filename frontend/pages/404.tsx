import { SentimentVeryDissatisfied } from '@mui/icons-material'
import { Box, Button, Stack, Typography } from '@mui/material'
import Link from 'src/Link'

export default function NotFound() {
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
            {`Hmm... We're having trouble finding this page.`}
          </Typography>
          <Link href='/'>
            <Button>Click here to go back to the main page</Button>
          </Link>
        </Stack>
      </Box>
    </Stack>
  )
}
