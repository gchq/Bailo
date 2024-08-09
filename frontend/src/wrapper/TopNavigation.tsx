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
  MenuList,
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
import { DRAWER_WIDTH } from '../../utils/constants'
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
      sx={{
        ...pageTopStyling,
        top: 'unset',
        background: theme.palette.navbarGradient
          ? `linear-gradient(276deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`
          : `${theme.palette.background}`,
      }}
    >
      <Toolbar
        sx={{
          pr: '24px', // keep right padding when drawer closed
        }}
      >
        <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ width: '100%' }}>
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
              >
                <Link href='/entry/new'>
                  <MenuItem>
                    <ListItemIcon>
                      <Add fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Create</ListItemText>
                  </MenuItem>
                </Link>
                <Divider />
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
                    >
                      <UserDisplay dn={currentUser.dn} hidePopover />
                    </Button>
                    <Menu anchorEl={userMenuAnchorEl} open={actionOpen} onClose={handleMenuClose}>
                      <MenuList>
                        {/* TODO - currently breaks v1. Re-add when v2 is fully adopted
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
                        </Tooltip>*/}
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
            </Box>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
