import { Add, Settings } from '@mui/icons-material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Stack,
  Switch,
  Toolbar,
  Typography,
} from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { styled, useTheme } from '@mui/material/styles'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { MouseEvent, useContext, useState } from 'react'

import { EntityKind, User } from '../../types/types'
import ExpandableButton from '../common/ExpandableButton'
import UserAvatar from '../common/UserAvatar'
import ThemeModeContext from '../contexts/themeModeContext'
import Link from '../Link'

const drawerWidth = 240

type TopNavigationProps = {
  drawerOpen?: boolean
  toggleDrawer: () => void
  pageTopStyling?: any
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
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin-left'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}))

// This is currently only being used by the beta wrapper
export default function TopNavigation({
  drawerOpen = false,
  toggleDrawer,
  pageTopStyling = {},
  currentUser,
}: TopNavigationProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const actionOpen = anchorEl !== null
  const router = useRouter()
  const theme = useTheme()
  const { toggleDarkMode } = useContext(ThemeModeContext)

  const handleUserMenuClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleNewModelClicked = () => {
    router.push('/beta/model/new/model')
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
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
        <IconButton
          edge='start'
          color='inherit'
          aria-label='open drawer'
          onClick={toggleDrawer}
          sx={{
            marginRight: '36px',
            ...(drawerOpen && { display: 'none' }),
          }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: { xs: 'flex', cursor: 'pointer' } }}>
          <Link href='/beta' color='inherit' underline='none'>
            <Image src='/bailo-logo.png' alt='Bailo Logo' width={35} height={45} priority />
          </Link>
        </Box>
        <Box sx={{ flexGrow: 1, ml: 2, display: { xs: 'none', md: 'flex', cursor: 'pointer' } }}>
          <Link
            href='/beta'
            color='inherit'
            underline='none'
            style={{ color: 'inherit', textDecoration: 'inherit', fontSize: '1.25rem', fontWeight: 500 }}
          >
            Bailo
            {betaAdornment}
          </Link>
        </Box>
        <Stack direction='row' spacing={2} justifyContent='center' alignItems='center'>
          <ExpandableButton label='Add Model' icon={<Add />} onClick={() => handleNewModelClicked()} />
          {currentUser ? (
            <>
              <IconButton onClick={handleUserMenuClicked} data-test='userMenuButton'>
                <UserAvatar entity={{ kind: EntityKind.USER, id: currentUser.id }} size='chip' />
              </IconButton>
              <Menu sx={{ mt: '10px', right: 0 }} anchorEl={anchorEl} open={actionOpen} onClose={handleMenuClose}>
                <MenuList>
                  <MenuItem data-test='toggleDarkMode'>
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
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
