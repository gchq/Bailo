import '@fontsource/pacifico'

import { Add, Menu as MenuIcon, Settings } from '@mui/icons-material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LogoutIcon from '@mui/icons-material/Logout'
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Stack,
  Switch,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { styled, useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { CSSProperties, MouseEvent, useContext, useMemo, useState } from 'react'
import ModelSearchField from 'src/wrapper/ModelSearchField'

import { EntityKind } from '../../types/types'
import { User } from '../../types/v2/types'
import { DRAWER_WIDTH } from '../../utils/constants'
import ExpandableButton from '../common/ExpandableButton'
import UserAvatar from '../common/UserAvatar'
import ThemeModeContext from '../contexts/themeModeContext'
import Link from '../Link'

export type TopNavigationProps = {
  drawerOpen?: boolean
  pageTopStyling?: CSSProperties
  currentUser: User
}

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
    marginLeft: DRAWER_WIDTH,
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    transition: theme.transitions.create(['width', 'margin-left'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}))

// This is currently only being used by the beta wrapper
export default function TopNavigation({ drawerOpen = false, pageTopStyling = {}, currentUser }: TopNavigationProps) {
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [navbarAnchorEl, setNavbarAnchorEl] = useState<HTMLButtonElement | null>(null)

  const actionOpen = useMemo(() => !!userMenuAnchorEl, [userMenuAnchorEl])
  const navbarMenuOpen = useMemo(() => !!navbarAnchorEl, [navbarAnchorEl])
  const isDarkMode = useMemo(() => localStorage.getItem('dark_mode_enabled') === 'true', [])

  const router = useRouter()
  const theme = useTheme()
  const { toggleDarkMode } = useContext(ThemeModeContext)
  const isSmOrLarger = useMediaQuery(theme.breakpoints.up('sm'))

  const handleUserMenuClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setUserMenuAnchorEl(event.currentTarget)
  }

  const handleNavMenuClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setNavbarAnchorEl(event.currentTarget)
  }

  const handleNewModelClicked = () => {
    router.push('/beta/model/new')
  }

  const handleMenuClose = () => {
    setUserMenuAnchorEl(null)
  }

  const betaAdornment = (
    <Box component='span' sx={{ marginLeft: 1, color: '#cecece', fontSize: 15 }}>
      beta
    </Box>
  )

  return (
    <AppBar
      open={drawerOpen}
      position='absolute'
      data-test='appBar'
      sx={{
        ...pageTopStyling,
        top: 'unset',
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(276deg, rgba(214,37,96,1) 0%, rgba(84,39,142,1) 100%)'
            : '#242424',
      }}
    >
      <Toolbar
        sx={{
          pr: '24px', // keep right padding when drawer closed
        }}
      >
        {!isSmOrLarger && (
          <Box>
            <IconButton onClick={handleNavMenuClicked}>
              <MenuIcon sx={{ color: theme.palette.topNavigation.main }} />
            </IconButton>
            <Menu anchorEl={navbarAnchorEl} open={navbarMenuOpen} onClose={() => setNavbarAnchorEl(null)}>
              <Link href='/beta/model/new'>
                <MenuItem>
                  <ListItemIcon>
                    <Add fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Add new model</ListItemText>
                </MenuItem>
              </Link>
              <Divider />
              <Tooltip title='This feature has been temporarily disabled'>
                <span>
                  <MenuItem disabled data-test='toggleDarkMode'>
                    <ListItemIcon>
                      <DarkModeIcon fontSize='small' />
                    </ListItemIcon>
                    <Switch size='small' checked={isDarkMode} onChange={toggleDarkMode} />
                  </MenuItem>
                </span>
              </Tooltip>
              <Link href='/api/logout' color='inherit' underline='none'>
                <MenuItem data-test='logoutLink'>
                  <ListItemIcon>
                    <LogoutIcon fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Sign Out</ListItemText>
                </MenuItem>
              </Link>
            </Menu>
          </Box>
        )}
        <Box sx={{ flexGrow: 1, ml: 2, cursor: 'pointer' }}>
          <Link href='/beta' color='inherit' underline='none' style={{ color: 'inherit', textDecoration: 'inherit' }}>
            <Typography variant='h5' component='div'>
              <span style={{ fontFamily: 'Pacifico' }}>Bailo</span>
              {betaAdornment}
            </Typography>
          </Link>
        </Box>
        {isSmOrLarger && (
          <Box>
            <Stack direction='row' spacing={2} justifyContent='center' alignItems='center'>
              <ExpandableButton
                label='Add Model'
                icon={<Add />}
                onClick={() => handleNewModelClicked()}
                ariaLabel='Add a new model'
                height='40px'
              />
              <ModelSearchField />
              {currentUser ? (
                <>
                  <IconButton onClick={handleUserMenuClicked} data-test='userMenuButton'>
                    <UserAvatar entity={{ kind: EntityKind.USER, id: currentUser.dn }} size='chip' />
                  </IconButton>
                  <Menu anchorEl={userMenuAnchorEl} open={actionOpen} onClose={handleMenuClose}>
                    <MenuList>
                      {/* TODO - currently breaks v1. Re-add when v2 is fully adopted */}
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
                      <Link href='/beta/settings' color='inherit' underline='none'>
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
            </Stack>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
