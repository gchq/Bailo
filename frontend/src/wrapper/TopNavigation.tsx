import '@fontsource/pacifico'

import { Add, KeyboardArrowDown, KeyboardArrowUp, Menu as MenuIcon, Person, Settings } from '@mui/icons-material'
import LogoutIcon from '@mui/icons-material/Logout'
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { alpha, styled, useTheme } from '@mui/material/styles'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { CSSProperties, MouseEvent, useMemo, useState } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import EntrySearch from 'src/wrapper/EntrySearch'

import bailoLogo from '../../public/logo-horizontal-light.png'
import { User } from '../../types/types'
import ExpandableButton from '../common/ExpandableButton'
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
})<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin-left'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        transition: theme.transitions.create(['width', 'margin-left'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}))

export default function TopNavigation({ drawerOpen = false, pageTopStyling = {}, currentUser }: TopNavigationProps) {
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [navbarAnchorEl, setNavbarAnchorEl] = useState<HTMLButtonElement | null>(null)

  const actionOpen = useMemo(() => !!userMenuAnchorEl, [userMenuAnchorEl])
  const navbarMenuOpen = useMemo(() => !!navbarAnchorEl, [navbarAnchorEl])

  const router = useRouter()
  const theme = useTheme()
  const isSmOrLarger = useMediaQuery(theme.breakpoints.up('sm'))

  const handleUserMenuClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setUserMenuAnchorEl(event.currentTarget)
  }

  const handleNavMenuClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setNavbarAnchorEl(event.currentTarget)
  }

  const handleCreateEntryClick = () => {
    router.push('/entry/new')
  }

  const handleMenuClose = () => {
    setUserMenuAnchorEl(null)
  }

  return (
    <AppBar
      open={drawerOpen}
      position='absolute'
      data-test='appBar'
      sx={(theme) => ({
        ...pageTopStyling,
        top: 'unset',
        // TODO - use "theme.applyStyles" when implementing dark mode
        background: '#242424',
        ...theme.applyStyles('light', {
          background: 'linear-gradient(276deg, rgba(214,37,96,1) 0%, rgba(84,39,142,1) 100%)',
        }),
      })}
    >
      <Toolbar
        sx={{
          pr: '24px', // keep right padding when drawer closed
        }}
      >
        <Stack direction='row' spacing={2} justifyContent='space-between' alignItems='center' sx={{ width: '100%' }}>
          {!isSmOrLarger && (
            <Box>
              <IconButton onClick={handleNavMenuClicked}>
                <MenuIcon sx={{ color: theme.palette.topNavigation.main }} />
              </IconButton>
              <Menu
                anchorEl={navbarAnchorEl}
                open={navbarMenuOpen}
                onClose={() => setNavbarAnchorEl(null)}
                sx={{ py: 0 }}
                role='menuitem'
              >
                <MenuItem component='a' href='/entry/new'>
                  <ListItemIcon>
                    <Add fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Create</ListItemText>
                </MenuItem>
                <span style={{ marginLeft: 2 }}>
                  <EntrySearch />
                </span>
                <Divider />
                <MenuItem component='a' href='/settings' data-test='settingsLink' role='menuitem'>
                  <ListItemIcon>
                    <Settings fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                <MenuItem component='a' href='/api/logout' data-test='logoutLink' role='menuitem'>
                  <ListItemIcon>
                    <LogoutIcon fontSize='small' />
                  </ListItemIcon>
                  <ListItemText>Sign out</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}
          <Link
            href='/'
            color='inherit'
            underline='none'
            style={{ color: 'inherit', textDecoration: 'inherit', cursor: 'pointer' }}
          >
            <Stack justifyContent='center' alignItems='left'>
              <Image src={bailoLogo} alt='bailo logo' width={142} height={60} />
            </Stack>
          </Link>
          {isSmOrLarger && (
            <Box>
              <Stack direction='row' spacing={1} justifyContent='center' alignItems='center'>
                <ExpandableButton
                  label='Create'
                  icon={<Add />}
                  onClick={handleCreateEntryClick}
                  ariaLabel='Create a new data card or model'
                  height='40px'
                />
                <EntrySearch />
                {currentUser ? (
                  <>
                    <Button
                      startIcon={<Person />}
                      endIcon={actionOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      sx={{
                        color: 'white',
                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                        '&:hover, &:focus': {
                          backgroundColor: alpha(theme.palette.common.white, 0.25),
                        },
                        textTransform: 'capitalize',
                      }}
                      onClick={handleUserMenuClicked}
                      data-test='userMenuButton'
                      aria-label='User menu dropdown button'
                    >
                      <UserDisplay dn={currentUser.dn} hidePopover />
                    </Button>
                    <Menu anchorEl={userMenuAnchorEl} open={actionOpen} onClose={handleMenuClose} role='menu'>
                      <MenuItem component='a' data-test='settingsLink' role='menuitem' href='/settings'>
                        <ListItemIcon>
                          <Settings fontSize='small' />
                        </ListItemIcon>
                        <ListItemText>Settings</ListItemText>
                      </MenuItem>
                      <MenuItem component='a' href='/api/logout' data-test='logoutLink' role='menuitem'>
                        <ListItemIcon>
                          <LogoutIcon fontSize='small' />
                        </ListItemIcon>
                        <ListItemText>Sign out</ListItemText>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Typography variant='caption'>Loading...</Typography>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
