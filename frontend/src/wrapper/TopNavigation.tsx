import '@fontsource/pacifico'

import Add from '@mui/icons-material/Add'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import Person from '@mui/icons-material/Person'
import Search from '@mui/icons-material/Search'
import Settings from '@mui/icons-material/Settings'
import {
  Button,
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
import TopNavSearchDialog from 'src/wrapper/TopNavSearchDialog'

import bailoLogo from '../../public/logo-horizontal-light.png'
import { User } from '../../types/types'
import ExpandableButton from '../common/ExpandableButton'
import Link from '../Link'

export type TopNavigationProps = {
  toggleDrawer: () => void
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

export default function TopNavigation({ toggleDrawer, pageTopStyling = {}, currentUser }: TopNavigationProps) {
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [isTopNavSearchOpen, setIsTopNavSearchOpen] = useState(false)

  const actionOpen = useMemo(() => !!userMenuAnchorEl, [userMenuAnchorEl])

  const router = useRouter()
  const theme = useTheme()
  const isSmOrLarger = useMediaQuery(theme.breakpoints.up('sm'))

  const handleUserMenuClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setUserMenuAnchorEl(event.currentTarget)
  }

  const handleCreateEntryClick = () => {
    router.push('/entry/new')
  }

  const handleMenuClose = () => {
    setUserMenuAnchorEl(null)
  }

  return (
    <AppBar
      position='fixed'
      data-test='appBar'
      sx={(theme) => ({
        ...pageTopStyling,
        top: 'unset',
        // TODO - use "theme.applyStyles" when implementing dark mode
        background: '#242424',
        ...theme.applyStyles('light', {
          background: `linear-gradient(276deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
        }),
      })}
    >
      <Toolbar
        sx={{
          pr: '24px', // keep right padding when drawer closed
        }}
      >
        <Stack
          direction='row'
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          {!isSmOrLarger && (
            <Stack
              direction='row'
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Stack direction='row'>
                <IconButton onClick={toggleDrawer}>
                  <MenuIcon sx={{ color: theme.palette.topNavigation.main }} />
                </IconButton>
                <Link
                  href='/'
                  color='inherit'
                  underline='none'
                  style={{ color: 'inherit', textDecoration: 'inherit', cursor: 'pointer' }}
                >
                  <Stack
                    sx={{
                      justifyContent: 'center',
                      alignItems: 'left',
                    }}
                  >
                    <Image src={bailoLogo} alt='bailo logo' width={142} height={60} />
                  </Stack>
                </Link>
              </Stack>
              <Stack direction='row' sx={{ alignItems: 'center' }} spacing={1}>
                <IconButton
                  onClick={() => setIsTopNavSearchOpen(true)}
                  sx={{
                    color: 'white',
                    backgroundColor: alpha(theme.palette.common.white, 0.15),
                    '&:hover, &:focus': {
                      backgroundColor: alpha(theme.palette.common.white, 0.25),
                    },
                    textTransform: 'capitalize',
                    height: 'max-content',
                  }}
                >
                  <Search />
                </IconButton>
                <IconButton
                  onClick={handleCreateEntryClick}
                  sx={{
                    color: 'white',
                    backgroundColor: alpha(theme.palette.common.white, 0.15),
                    '&:hover, &:focus': {
                      backgroundColor: alpha(theme.palette.common.white, 0.25),
                    },
                    textTransform: 'capitalize',
                    height: 'max-content',
                  }}
                >
                  <Add />
                </IconButton>
                {currentUser ? (
                  <>
                    <IconButton
                      sx={{
                        color: 'white',
                        backgroundColor: alpha(theme.palette.common.white, 0.15),
                        '&:hover, &:focus': {
                          backgroundColor: alpha(theme.palette.common.white, 0.25),
                        },
                        textTransform: 'capitalize',
                        height: 'max-content',
                      }}
                      onClick={handleUserMenuClicked}
                      data-test='userMenuButton'
                      aria-label='User menu dropdown button'
                    >
                      <Person />
                    </IconButton>
                    <Menu
                      disableScrollLock
                      anchorEl={userMenuAnchorEl}
                      open={actionOpen}
                      onClose={handleMenuClose}
                      role='menu'
                    >
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
            </Stack>
          )}
          {isSmOrLarger && (
            <Stack
              direction='row'
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Link
                href='/'
                color='inherit'
                underline='none'
                style={{ color: 'inherit', textDecoration: 'inherit', cursor: 'pointer' }}
              >
                <Stack
                  sx={{
                    justifyContent: 'center',
                    alignItems: 'left',
                  }}
                >
                  <Image src={bailoLogo} alt='bailo logo' width={142} height={60} />
                </Stack>
              </Link>
              <Stack
                direction='row'
                spacing={1}
                sx={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
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
                    <Menu
                      disableScrollLock
                      anchorEl={userMenuAnchorEl}
                      open={actionOpen}
                      onClose={handleMenuClose}
                      role='menu'
                    >
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
            </Stack>
          )}
        </Stack>
      </Toolbar>
      <TopNavSearchDialog open={isTopNavSearchOpen} setOpen={(isOpen: boolean) => setIsTopNavSearchOpen(isOpen)} />
    </AppBar>
  )
}
