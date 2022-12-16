import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import imageLoader from '@/components/imageLoader'
import bailoLogo from '../public/bailo-logo.png'
import marketplaceImage from '../public/marketplace.png'
import Image from 'next/image'
import localFont from '@next/font/local'
import Link from '@/components/Link'
import { createRef, useRef } from 'react'
import Tooltip from '@mui/material/Tooltip'
import GitHubIcon from '@mui/icons-material/GitHub'
import IconButton from '@mui/material/IconButton'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import StarPurple500Icon from '@mui/icons-material/StarPurple500'

const myFont = localFont({ src: '../public/fonts/NunitoSans-Black.ttf' })

export default function Home() {
  const ref = createRef<HTMLDivElement>()

  const scrollToContent = () => {
    console.log(ref)
    if (ref.current) {
      ref.current.scrollIntoView()
    }
  }
  return (
    <>
      <Box
        sx={{
          backgroundColor: '#f8e6dc',
        }}
        id='home-welcome-container'
      >
        <Container sx={{ ml: 12, p: 4, position: 'absolute', float: 'right' }}>
          <Link href='https://github.com/gchq/bailo'>
            <Tooltip title='Open GitHub'>
              <IconButton sx={{ p: 0 }}>
                <GitHubIcon color='secondary' sx={{ fontSize: 40 }} />
              </IconButton>
            </Tooltip>
          </Link>
        </Container>
        <Stack
          sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center',
          }}
          alignItems='center'
          spacing={1}
        >
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
            <Button
              onClick={scrollToContent}
              sx={{ minWidth: '200px', color: 'white' }}
              color='secondary'
              size='large'
              variant='contained'
            >
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
      <Box sx={{ m: 'auto', my: 8 }} ref={ref}>
        <Grid container alignItems='center' spacing={4}>
          <Grid item lg={6}>
            <Box sx={{ px: 10, py: 4, textAlign: 'center', height: '100%' }}>
              <Stack
                spacing={4}
                justifyContent='center'
                alignItems='center'
                divider={
                  <Divider flexItem>
                    <StarPurple500Icon color='secondary' />
                  </Divider>
                }
              >
                <Typography variant='h6'>
                  Provides a centralised repository of ML models, where possible with models in standard formats
                </Typography>
                <Typography variant='h6'>
                  Enables users to find existing ML models, encouraging re-use of best practice and avoiding duplication
                  of work
                </Typography>
                <Typography variant='h6'>
                  Ensures any deployed models are fully compliant, and that compliance rules are applied consistently
                  from a single service
                </Typography>
              </Stack>
            </Box>
          </Grid>
          <Grid item lg={6}>
            <Box sx={{ px: 10, py: 4 }}>
              <img id='marketplace-image' alt='Image Alt' src={marketplaceImage.src} style={{ width: '100%' }} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}
