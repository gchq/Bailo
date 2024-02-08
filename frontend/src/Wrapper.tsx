import AdminIcon from '@mui/icons-material/AdminPanelSettingsTwoTone'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftTwoTone'
import ContactSupportIcon from '@mui/icons-material/ContactSupportTwoTone'
import DarkModeIcon from '@mui/icons-material/DarkModeTwoTone'
import DashboardIcon from '@mui/icons-material/DashboardTwoTone'
import FileUploadIcon from '@mui/icons-material/FileUploadTwoTone'
import LinkIcon from '@mui/icons-material/LinkTwoTone'
import ListAltIcon from '@mui/icons-material/ListAlt'
import LogoutIcon from '@mui/icons-material/LogoutTwoTone'
import MenuIcon from '@mui/icons-material/MenuTwoTone'
import SchemaIcon from '@mui/icons-material/SchemaTwoTone'
import Settings from '@mui/icons-material/SettingsTwoTone'
import ViewList from '@mui/icons-material/ViewListTwoTone'
import { Container, ListItemButton } from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import MuiDrawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import { styled, ThemeProvider, useTheme } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Head from 'next/head'
import Image from 'next/legacy/image'
import React, { MouseEvent, ReactElement, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

import { useGetNumApprovals } from '../data/approvals'
import { useGetUiConfig } from '../data/uiConfig'
import { useGetCurrentUser } from '../data/user'
import bailoLogo from '../public/bailo-logo.png'
import { EntityKind } from '../types/types'
import Banner from './Banner'
import UserAvatar from './common/UserAvatar'
import ThemeModeContext from './contexts/themeModeContext'
import Copyright from './Copyright'
import Link from './Link'

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

type WrapperProps = {
  title: string
  page: string
  children?: ReactNode
}

export default function Wrapper({ title, page, children }: WrapperProps): ReactElement {
  const isDocsPage = useMemo(() => page.startsWith('docs'), [page])

  const [open, setOpen] = useState(false)
  const toggleDrawer = (): void => {
    setOpen(!open)
  }

  const theme = useTheme()
  const { toggleDarkMode } = useContext(ThemeModeContext)

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const { numApprovals, isNumApprovalsLoading } = useGetNumApprovals()
  const { currentUser } = useGetCurrentUser()

  const [pageTopStyling, setPageTopStyling] = useState({})
  const [contentTopStyling, setContentTopStyling] = useState({})
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const actionOpen = anchorEl !== null

  useEffect(() => {
    if (!isUiConfigLoading) {
      if (uiConfig && uiConfig.banner.enabled) {
        setPageTopStyling({
          mt: 4,
        })
        setContentTopStyling({
          mt: isDocsPage ? 4 : 4,
        })
      }
    }
  }, [isUiConfigLoading, uiConfig, isDocsPage])

  if (isUiConfigError) {
    if (isUiConfigError.status === 403) {
      return <p>Error authenticating user.</p>
    }

    return <p>Error loading UI Config: {isUiConfigError.info?.message}</p>
  }

  const handleUserMenuClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

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
      <Banner />
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        {!isUiConfigLoading && uiConfig && uiConfig.banner.enabled && <Box sx={{ mt: 20 }} />}
        <AppBar
          open={open}
          position='absolute'
          data-test='appBar'
          sx={{
            ...pageTopStyling,
            top: 'unset',
          }}
        >
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
              <Link href='/' color='inherit' underline='none'>
                <Image src={bailoLogo} alt='Logo' width={35} height={45} priority />
              </Link>
            </Box>
            <Box sx={{ flexGrow: 1, ml: 2, display: { xs: 'none', md: 'flex', cursor: 'pointer' } }}>
              <Link
                href='/'
                color='inherit'
                underline='none'
                style={{ color: 'inherit', textDecoration: 'inherit', fontSize: '1.25rem', fontWeight: 500 }}
              >
                Bailo
              </Link>
            </Box>
            {headerTitle}
            {currentUser ? (
              <>
                <IconButton onClick={handleUserMenuClicked} data-test='userMenuButton'>
                  <UserAvatar entity={{ kind: EntityKind.USER, id: currentUser.id }} size='chip' />
                </IconButton>
                <Menu sx={{ mt: '10px', right: 0 }} anchorEl={anchorEl} open={actionOpen} onClose={handleMenuClose}>
                  <MenuList>
                    <Tooltip title='This feature has been temporarily disabled'>
                      <span>
                        <MenuItem disabled data-test='toggleDarkMode'>
                          <ListItemIcon>
                            <DarkModeIcon fontSize='small' />
                          </ListItemIcon>
                          <Switch
                            size='small'
                            checked={localStorage.getItem('dark_mode_enabled') === 'true'}
                            onChange={toggleDarkMode}
                            inputProps={{ 'aria-label': 'controlled' }}
                          />
                        </MenuItem>
                      </span>
                    </Tooltip>
                    <Link href='/settings' color='inherit' underline='none'>
                      <MenuItem data-test='settingsLink'>
                        <ListItemIcon>
                          <Settings fontSize='small' />
                        </ListItemIcon>
                        <ListItemText>Settings</ListItemText>
                      </MenuItem>
                    </Link>
                    <Link href='/api/logout' color='inherit' underline='none'>
                      <MenuItem data-test='logoutLink'>
                        <ListItemIcon>
                          <LogoutIcon fontSize='small' />
                        </ListItemIcon>
                        <ListItemText>Sign Out</ListItemText>
                      </MenuItem>
                    </Link>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <Typography variant='caption'>Loading...</Typography>
            )}
          </Toolbar>
        </AppBar>
        <Drawer sx={pageTopStyling} variant='permanent' open={open}>
          <Toolbar
            sx={{
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <IconButton aria-label='close drawer' onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <StyledList>
            <Link href='/' color='inherit' underline='none'>
              <ListItemButton selected={page === 'marketplace' || page === 'model' || page === 'deployment'}>
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
              </ListItemButton>
            </Link>
            <Link href='/deployments' color='inherit' underline='none'>
              <ListItemButton selected={page === 'deployments'}>
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
              </ListItemButton>
            </Link>
            <Link href='/upload' color='inherit' underline='none'>
              <ListItemButton selected={page === 'upload'} data-test='uploadModelLink'>
                <ListItemIcon>
                  {!open ? (
                    <Tooltip title='Upload Model' arrow placement='right'>
                      <FileUploadIcon />
                    </Tooltip>
                  ) : (
                    <FileUploadIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary='Upload' />
              </ListItemButton>
            </Link>
            <Link href='/review' color='inherit' underline='none'>
              <ListItemButton selected={page === 'review'} data-test='reviewLink'>
                <ListItemIcon>
                  {!open ? (
                    <Tooltip title='Review' arrow placement='right'>
                      <Badge badgeContent={isNumApprovalsLoading ? 0 : numApprovals} color='primary'>
                        <ListAltIcon />
                      </Badge>
                    </Tooltip>
                  ) : (
                    <ListAltIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary='Reviews' />
              </ListItemButton>
            </Link>
            <Divider />
            <Link href='/docs/api'>
              <ListItemButton selected={page === 'api'} data-test='apiDocsLink'>
                <ListItemIcon>
                  {!open ? (
                    <Tooltip title='API' arrow placement='right'>
                      <LinkIcon />
                    </Tooltip>
                  ) : (
                    <LinkIcon />
                  )}
                </ListItemIcon>
                <ListItemText primary='API' />
              </ListItemButton>
            </Link>
            <Link href='/help'>
              <ListItemButton selected={page === 'help'} data-test='supportLink'>
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
              </ListItemButton>
            </Link>
            {currentUser && currentUser.roles.includes('admin') && (
              <>
                <Divider />
                <Link href='/admin'>
                  <ListItemButton selected={page === 'admin'}>
                    <ListItemIcon data-test='adminLink'>
                      {!open ? (
                        <Tooltip arrow title='Admin' placement='right'>
                          <AdminIcon />
                        </Tooltip>
                      ) : (
                        <AdminIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText primary='Admin' />
                  </ListItemButton>
                </Link>
                <Link href='/schemas'>
                  <ListItemButton selected={page === 'schemas'}>
                    <ListItemIcon data-test='designSchemaLink'>
                      {!open ? (
                        <Tooltip arrow title='Schemas' placement='right'>
                          <SchemaIcon />
                        </Tooltip>
                      ) : (
                        <SchemaIcon />
                      )}
                    </ListItemIcon>
                    <ListItemText primary='Schemas' />
                  </ListItemButton>
                </Link>
              </>
            )}
          </StyledList>
          <Divider />
        </Drawer>
        <Box
          component='main'
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
          }}
        >
          <Toolbar />
          <Box sx={{ ...contentTopStyling, height: 'calc(100vh - 98px)', overflow: 'auto' }}>
            {isDocsPage ? (
              children
            ) : (
              <>
                <Container maxWidth='xl' sx={{ mt: 4, mb: 4 }}>
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
