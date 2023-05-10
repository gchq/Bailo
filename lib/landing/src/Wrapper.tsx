import React, { MouseEvent, ReactElement, ReactNode, useContext, useEffect, useMemo } from 'react'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import MuiDrawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import { styled, ThemeProvider, useTheme } from '@mui/material/styles'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Head from 'next/head'
import Image from 'next/legacy/image'
import Link from './Link'
import Copyright from './Copyright'
import imageLoader from './imageLoader'

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
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin-left'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}))

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: 'border-box',
    ...(!open && {
      overflowX: 'hidden',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up('sm')]: {
        width: theme.spacing(9),
      },
    }),
  },
}))

type WrapperProps = {
  title: string
  page: string
  children?: ReactNode
}

export default function Wrapper({ title, page, children }: WrapperProps): ReactElement {
  const isDocsPage = useMemo(() => page.startsWith('docs'), [page])

  const theme = useTheme()

  const headerTitle =
    typeof title === 'string' ? (
      <Typography
        noWrap
        component='h1'
        variant='h6'
        color='inherit'
        data-test='headerTitle'
        sx={{ mr: '55px', flexGrow: 1 }}
      >
        {title}
      </Typography>
    ) : (
      title
    )

  const StyledList = styled(List)({
    paddingTop: 0,
    paddingBottom: 0,
    '&& .Mui-selected, && .Mui-selected:hover': {
      '&, & .MuiListItemIcon-root': {
        color: theme.palette.secondary.main,
      },
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>{`${title} :: Bailo`}</title>
      </Head>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position='absolute' data-test='appBar' sx={{ top: 'unset' }}>
          <Toolbar
            sx={{
              pr: '24px', // keep right padding when drawer closed
            }}
          >
            <Box sx={{ display: { xs: 'flex', cursor: 'pointer' } }}>
              <Link href='/' passHref color='inherit' underline='none'>
                <Image loader={imageLoader} src='/bailo-logo.png' alt='Logo' width={35} height={45} priority />
              </Link>
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                ml: 2,
                display: { xs: 'none', md: 'flex', cursor: 'pointer' },
              }}
            >
              <Link
                href='/'
                passHref
                color='inherit'
                underline='none'
                style={{
                  color: 'inherit',
                  textDecoration: 'inherit',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                }}
              >
                Bailo
              </Link>
            </Box>
            Documentation
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
          <Box>
            {isDocsPage ? (
              children
            ) : (
              <>
                <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
                  {children}
                </Container>
                <Copyright sx={{ mb: 2 }} />
              </>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
