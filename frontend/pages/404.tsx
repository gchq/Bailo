import SentimentVeryDissatisfied from '@mui/icons-material/SentimentVeryDissatisfied'
import { Box, Button, Stack, Typography } from '@mui/material'
import Link from 'src/Link'

export default function NotFound() {
  return (
    <Stack
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Box sx={{ m: 5, p: 2, width: 'fit-content' }}>
        <Stack
          spacing={2}
          sx={{
            alignItems: 'center',
          }}
        >
          <Stack
            direction='row'
            spacing={2}
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <SentimentVeryDissatisfied color='secondary' sx={{ fontSize: 75 }} />
            <Typography color='secondary' sx={{ fontSize: 75 }}>
              404
            </Typography>
          </Stack>
          <Typography
            component='h3'
            variant='h5'
            color='primary'
            sx={{
              fontWeight: 'bold',
            }}
          >
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
