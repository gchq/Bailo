import { Add, Settings } from '@mui/icons-material'
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
  Toolbar,
  Typography,
} from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { styled, useTheme } from '@mui/material/styles'
import { Pacifico } from 'next/font/google'
import { useRouter } from 'next/router'
import { CSSProperties, MouseEvent, useState } from 'react'

import { EntityKind, User } from '../../types/types'
import { DRAWER_WIDTH } from '../../utils/constants'
import ExpandableButton from '../common/ExpandableButton'
import UserAvatar from '../common/UserAvatar'
import Link from '../Link'

type TopNavigationProps = {
  drawerOpen?: boolean
  toggleDrawer: () => void
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

const pacifico = Pacifico({ subsets: ['latin'], weight: '400' })

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

  const handleUserMenuClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleNewModelClicked = () => {
    router.push('/beta/model/new')
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
            ? `linear-gradient(276deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`
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
            marginRight: 2,
            ...(drawerOpen && { display: 'none' }),
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, ml: 2, display: { cursor: 'pointer' } }}>
          <Link href='/beta' color='inherit' underline='none' style={{ color: 'inherit', textDecoration: 'inherit' }}>
            <Typography variant='h5' component='div'>
              <span className={pacifico.className}>Bailo</span>
              {betaAdornment}
            </Typography>
          </Link>
        </Box>
        <Stack direction='row' spacing={2} justifyContent='center' alignItems='center'>
          <ExpandableButton
            label='Add Model'
            icon={<Add />}
            onClick={() => handleNewModelClicked()}
            ariaLabel='Add a new model'
          />
          {currentUser ? (
            <>
              <IconButton onClick={handleUserMenuClicked} data-test='userMenuButton'>
                <UserAvatar entity={{ kind: EntityKind.USER, id: currentUser.id }} size='chip' />
              </IconButton>
              <Menu sx={{ mt: '10px', right: 0 }} anchorEl={anchorEl} open={actionOpen} onClose={handleMenuClose}>
                <MenuList>
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
      </Toolbar>
    </AppBar>
  )
}
