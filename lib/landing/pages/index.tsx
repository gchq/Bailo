import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import BackupIcon from '@mui/icons-material/Backup'
import imageLoader from '@/components/imageLoader'
import bailoLogo from '../public/bailo-logo.png'
import Image from 'next/image'
import localFont from '@next/font/local'
import Link from '@/components/Link'
import { useRef } from 'react'

const myFont = localFont({ src: '../public/fonts/NunitoSans-Black.ttf' })

export default function Home() {
  const ref = useRef(null)
  return (
    <>
      <Box
        sx={{
          height: '100vh',
          backgroundColor: '#f8e6dc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
        }}
        id='home-welcome-container'
      >
        <Stack alignItems='center' spacing={1}>
          <Stack justifyContent='center' alignItems='center' spacing={1} sx={{ mb: 2 }}>
            <Image loader={imageLoader} src={bailoLogo} alt='Logo' width={250} height={300} />
            <Typography className={myFont.className} variant='h1' sx={{ color: 'white' }}>
              Bailo
            </Typography>
            <Typography variant='h5' sx={{ color: 'white' }}>
              Making it easy to compliantly manage the machine learning lifecycle
            </Typography>
          </Stack>
          <Stack direction='row' justifyContent='center' spacing={2} sx={{ p: 4 }}>
            <Button sx={{ minWidth: '200px', color: 'white' }} color='secondary' size='large' variant='contained'>
              Read more
            </Button>
            <Link href='/docs'>
              <Button sx={{ minWidth: '200px', color: 'white' }} color='secondary' size='large' variant='outlined'>
                Documentation
              </Button>
            </Link>
          </Stack>
        </Stack>
      </Box>
      <Box id='arrow-down' />
      <Box sx={{ maxWidth: 800, m: 'auto', mt: 10 }} ref={ref}>
        <Grid container spacing={4}>
          <Grid item sm={6} sx={{ height: '500px' }}>
            <BackupIcon />
            <Typography>Upload</Typography>
          </Grid>
          <Grid item sm={6} sx={{ height: '500px' }}>
            2
          </Grid>
          <Grid item sm={6} sx={{ height: '500px' }}>
            3
          </Grid>
          <Grid item sm={6} sx={{ height: '500px' }}>
            4
          </Grid>
        </Grid>
      </Box>
    </>
  )
}
