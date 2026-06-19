import { Button, Stack } from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import { styled, ThemeProvider, useTheme } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import Head from 'next/head'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { ReactElement, ReactNode, useMemo } from 'react'
import bailoLogo from '../public/logo-horizontal-light.png'
import Copyright from './Copyright'
import imageLoader from './imageLoader'
import Link from './Link'
import navigationLinks from './navigationLinks'

const drawerWidth = 240

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin-left'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: 'fit-content',
    transition: theme.transitions.create(['width', 'margin-left'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}))

type WrapperProps = {
  title: string
  children?: ReactNode
}

export default function Wrapper({ title, children }: WrapperProps): ReactElement {
  const router = useRouter()

  const isDocsPage = useMemo(
    () => router.pathname === '/docs' || router.route.startsWith('/docs/') || router.route.startsWith('/python-docs'),
    [router],
  )

  const theme = useTheme()

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>{`${title} · Bailo`}</title>
      </Head>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <CssBaseline />
        <AppBar position='static' data-test='appBar' sx={{ boxShadow: 'none', flexShrink: 0 }}>
          <Toolbar
            sx={{
              pr: '24px', // keep right padding when drawer closed
            }}
          >
            <Box sx={{ display: { xs: 'flex', cursor: 'pointer' } }}>
              <Link href='/'>
                <Image loader={imageLoader} src={bailoLogo} alt='Logo' width={142} height={60} priority />
              </Link>
            </Box>
            {navigationLinks
              .filter((link) => link.primary)
              .map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button sx={{ color: 'white' }}>{link.label}</Button>
                </Link>
              ))}
          </Toolbar>
        </AppBar>
        <Box
          component='main'
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
            flexGrow: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {isDocsPage ? (
            children
          ) : (
            <Box>
              <Box>{children}</Box>
              <Box component='footer' sx={{ borderTop: 1, borderColor: 'divider', py: 3, px: 2, textAlign: 'center' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='center' spacing={2} sx={{ mb: 4 }}>
                  {navigationLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </Stack>
                <Copyright />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  )
}
