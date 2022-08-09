import * as React from 'react'
import { styled, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import MuiDrawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Container from '@mui/material/Container'
import MenuIcon from '@mui/icons-material/MenuTwoTone'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftTwoTone'
import NotificationsIcon from '@mui/icons-material/NotificationsTwoTone'
import ViewList from '@mui/icons-material/ViewListTwoTone'
import Link from 'next/link'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuList from '@mui/material/MenuList'
import DashboardIcon from '@mui/icons-material/DashboardTwoTone'
import FileUploadIcon from '@mui/icons-material/FileUploadTwoTone'
import ContactSupportIcon from '@mui/icons-material/ContactSupportTwoTone'
import LinkIcon from '@mui/icons-material/LinkTwoTone'
import ListAltIcon from '@mui/icons-material/ListAlt'
import DarkModeIcon from '@mui/icons-material/DarkModeTwoTone'
import { useGetUiConfig } from '../data/uiConfig'
import Banner from './Banner'
import { useGetNumRequests } from '../data/requests'
import Image from 'next/image'
import Tooltip from '@mui/material/Tooltip'
import Copyright from './Copyright'
import Settings from '@mui/icons-material/SettingsTwoTone'
import { useGetCurrentUser } from '../data/user'
import UserAvatar from './common/UserAvatar'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import useTheme from '@mui/styles/useTheme'
import { lightTheme } from './theme'
import { DarkModeContext } from '../pages/_app'

const drawerWidth: number = 240

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

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
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

export default function Wrapper({ title, page, children }: { title: any; page: string; children?: any }) {
  const [open, setOpen] = React.useState(false)
  const toggleDrawer = () => {
    setOpen(!open)
  }

  const theme: any = useTheme() || lightTheme
  const toggleDarkMode: any = React.useContext(DarkModeContext)

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { numRequests, isNumRequestsLoading } = useGetNumRequests()
  const { currentUser } = useGetCurrentUser()

  const [pageTopStyling, setPageTopStyling] = React.useState({})
  const [contentTopStyling, setContentTopStyling] = React.useState({})
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null)

  const actionOpen = anchorEl !== null

  React.useEffect(() => {
    if (!isUiConfigLoading) {
      if (uiConfig?.banner?.enable) {
        setPageTopStyling({
          mt: 4,
        })
        setContentTopStyling({
          mt: 8,
        })
      }
    }
  }, [isUiConfigLoading, uiConfig])

  if (isUiConfigError) {
    if (isUiConfigError.status === 403) {
      return (
        <>
          <p>Error authenticating user.</p>
        </>
      )
    }

    return <p>Error loading UI Config: {isUiConfigError.info?.message}</p>
  }

  const userMenuClicked = (event: any) => {
    setAnchorEl(event.currentTarget as HTMLDivElement)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const headerTitle = (
    <>
      {typeof title === 'string' ? (
        <>
          <Typography component='h1' variant='h6' color='inherit' noWrap sx={{ mr: '55px', flexGrow: 1 }}>
            {title}
          </Typography>
        </>
      ) : (
        <>{title}</>
      )}
    </>
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
      <Banner />
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {!isUiConfigLoading && uiConfig!.banner.enable && <Box sx={{ mt: 20 }} />}
        <AppBar sx={{ ...pageTopStyling, top: 'unset', backgroundColor: 'primary' }} position='absolute' open={open}>
          <Toolbar
            sx={{
              pr: '24px', // keep right padding when drawer closed
            }}
          >
            <IconButton
              edge='start'
              color='inherit'
              aria-label='open drawer'
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: { xs: 'flex', cursor: 'pointer' } }}>
              <Link href='/' passHref>
                <a>
                  <Image src='/Bailo-logo-reverse.png' alt='Logo' width={55} height={55} priority />
                </a>
              </Link>
            </Box>
            <Typography
              variant='h6'
              noWrap
              component='div'
              sx={{ flexGrow: 1, ml: 2, display: { xs: 'none', md: 'flex' } }}
            >
              Bailo
            </Typography>
            {headerTitle}
            <Link href='/review' passHref>
              <IconButton color='inherit'>
                <Badge badgeContent={isNumRequestsLoading ? 0 : numRequests} color='secondary'>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Link>
            {currentUser ? (
              <>
                <IconButton onClick={userMenuClicked} data-test='showUserMenu'>
                  <UserAvatar username={currentUser.id} size='chip' />
                </IconButton>
                <Menu
                  sx={{ mt: '10px', right: 0 }}
                  anchorEl={anchorEl as HTMLDivElement}
                  open={actionOpen}
                  onClose={handleMenuClose}
                >
                  <MenuList>
                    <MenuItem data-test='toggleDarkMode'>
                      <ListItemIcon>
                        <DarkModeIcon fontSize='small' />
                      </ListItemIcon>
                      <Switch
                        checked={localStorage.getItem('dark_mode_enabled') === 'true'}
                        onChange={toggleDarkMode}
                        inputProps={{ 'aria-label': 'controlled' }}
                        color='secondary'
                      />
                    </MenuItem>
                    <Link href='/settings' passHref>
                      <MenuItem data-test='settingsLink'>
                        <ListItemIcon>
                          <Settings
                            fontSize='small'
                            sx={{ '&:hover': { color: theme.palette.mode === 'dark' ? '#4c4c4c' : '' } }}
                          />
                        </ListItemIcon>
                        <ListItemText>Settings</ListItemText>
                      </MenuItem>
                    </Link>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <Typography variant='caption'>'Loading...'</Typography>
            )}
          </Toolbar>
        </AppBar>
        <Drawer sx={pageTopStyling} variant='permanent' open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
            }}
          >
            <IconButton aria-label='close drawer' onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <StyledList>
            <Link href='/' passHref>
              <ListItem button selected={page === 'marketplace' || page === 'model' || page === 'deployment'}>
                <ListItemIcon>
                  {!open ? (
                    <Tooltip title='Marketplace' arrow placement='right'>
                      <DashboardIcon />
                    </Tooltip>
                  ) : (
                    <DashboardIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary='Marketplace' />
              </ListItem>
            </Link>
            <Link href='/deployments' passHref>
              <ListItem button selected={page === 'deployments'}>
                <ListItemIcon>
                  {!open ? (
                    <Tooltip title='My Deployments' arrow placement='right'>
                      <ViewList />
                    </Tooltip>
                  ) : (
                    <ViewList />
                  )}
                </ListItemIcon>
                <ListItemText primary='Deployments' />
              </ListItem>
            </Link>
            <Link href='/upload' passHref>
              <ListItem button selected={page === 'upload'}>
                <ListItemIcon data-test='uploadModelLink'>
                  {!open ? (
                    <Tooltip title='Upload Model' arrow placement='right'>
                      <FileUploadIcon />
                    </Tooltip>
                  ) : (
                    <FileUploadIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary='Upload' />
              </ListItem>
            </Link>
            <Link href='/review' passHref>
              <ListItem button selected={page === 'review'}>
                <ListItemIcon data-test='reviewLink'>
                  {!open ? (
                    <Tooltip title='Review' arrow placement='right'>
                      <ListAltIcon />
                    </Tooltip>
                  ) : (
                    <ListAltIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary='Reviews' />
              </ListItem>
            </Link>
            <Divider />
            <Link href='/docs/api' passHref>
              <ListItem button selected={page === 'api'}>
                <ListItemIcon>
                  {!open ? (
                    <Tooltip title='API' arrow placement='right'>
                      <LinkIcon />
                    </Tooltip>
                  ) : (
                    <LinkIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary='Support' />
              </ListItem>
            </Link>
            <Link href='/help' passHref>
              <ListItem button selected={page === 'help'}>
                <ListItemIcon>
                  {!open ? (
                    <Tooltip title='Help & Support' arrow placement='right'>
                      <ContactSupportIcon />
                    </Tooltip>
                  ) : (
                    <ContactSupportIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary='Support' />
              </ListItem>
            </Link>
          </StyledList>
          <Divider />
        </Drawer>
        <Box
          component='main'
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar />
          <Box sx={contentTopStyling}>
            <Container maxWidth='lg' sx={{ mt: 4, mb: 4 }}>
              {children}
            </Container>
            <Copyright sx={{ pb: 2 }} />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  )
}
