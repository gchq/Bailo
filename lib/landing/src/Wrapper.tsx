import React, { ReactElement, ReactNode, useMemo } from 'react'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import GitHubIcon from '@mui/icons-material/GitHub'
import CssBaseline from '@mui/material/CssBaseline'
import { styled, ThemeProvider, useTheme } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import Head from 'next/head'
import Image from 'next/legacy/image'
import Link from './Link'
import imageLoader from './imageLoader'
import { Button, IconButton, Tooltip } from '@mui/material'
import bailoLogo from '../public/logo-horizontal-light.png'

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
  page: string
  children?: ReactNode
}

export default function Wrapper({ title, page, children }: WrapperProps): ReactElement {
  const isDocsPage = useMemo(() => page.startsWith('docs'), [page])

  const theme = useTheme()

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>{`${title} · Bailo`}</title>
      </Head>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position='absolute' data-test='appBar' sx={{ top: 'unset', boxShadow: 'none' }}>
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
            <Link href='/docs'>
              <Button sx={{ color: 'white' }}>Documentation</Button>
            </Link>
            <Link href='https://github.com/gchq/bailo'>
              <Button sx={{ color: 'white' }}>Github</Button>
            </Link>
          </Toolbar>
        </AppBar>
        <Box
          component='main'
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Box>{isDocsPage ? children : <>{children}</>}</Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
