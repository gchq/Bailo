import Add from '@mui/icons-material/Add'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import AcUnitIcon from '@mui/icons-material/AcUnit';
import Person from '@mui/icons-material/Person'
import Settings from '@mui/icons-material/Settings'
import SettingsSuggestTwoToneIcon from '@mui/icons-material/SettingsSuggestTwoTone'
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import MuiAppBar, { type AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { alpha, styled, useTheme } from '@mui/material/styles'
import { visuallyHidden } from '@mui/utils'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { type CSSProperties, type MouseEvent, useContext, useMemo, useState } from 'react'
import UserDisplay from 'src/common/UserDisplay'
import UiConfigContext from 'src/contexts/uiConfigContext'
import DocsSearch from 'src/docs/DocsSearch'
import DocsSearchDialog from 'src/docs/DocsSearchDialog'
import { getSnowEnabled, saveSnowEnabled } from 'src/storage/userPreferences'
import ChristmasLights from 'src/wrapper/ChristmasLights'
import Snowfall from 'src/wrapper/Snowfall'

import bailoLogo from '../../public/logo-horizontal-light.png'
import { type User } from '../../types/types'
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
  const [docsSearchOpen, setDocsSearchOpen] = useState(false)
  const [snowEnabled, setSnowEnabled] = useState(() => typeof window !== 'undefined' && getSnowEnabled())

  const actionOpen = useMemo(() => !!userMenuAnchorEl, [userMenuAnchorEl])

  const router = useRouter()
  const theme = useTheme()
  const uiConfig = useContext(UiConfigContext)
  const today = new Date()
  const month = today.getMonth()
  const showChristmas =
    uiConfig.christmas.enabled && ((month === 11 && today.getDate() >= 1) || (month === 0 && today.getDate() <= 5))

  const handleUserMenuClicked = (event: MouseEvent<HTMLButtonElement>) => {
    setUserMenuAnchorEl(event.currentTarget)
  }

  const handleCreateEntryClick = () => {
    router.push('/entry/new')
  }

  const handleMenuClose = () => {
    setUserMenuAnchorEl(null)
  }

  const handleSnowToggle = () => {
    saveSnowEnabled(!snowEnabled)
    setSnowEnabled(!snowEnabled)
  }

  const snowToggleButton = (
    <Tooltip title={snowEnabled ? 'Turn off snow' : 'Turn on snow'}>
      <IconButton
        onClick={handleSnowToggle}
        aria-label={snowEnabled ? 'Turn off snow' : 'Turn on snow'}
        aria-pressed={snowEnabled}
        data-test='snowToggleButton'
        sx={{
          color: 'white',
          backgroundColor: alpha(theme.palette.common.white, 0.15),
          '&:hover, &:focus': {
            backgroundColor: alpha(theme.palette.common.white, 0.25),
          },
          height: 'max-content',
          // Diagonal strike-through over the tree when snow is off
          ...(!snowEnabled && {
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '60%',
              height: '2px',
              backgroundColor: 'currentColor',
              transform: 'rotate(-45deg)',
            },
          }),
        }}
      >
        <AcUnitIcon />
      </IconButton>
    </Tooltip>
  )

  return (
    <AppBar
      position='fixed'
      data-test='appBar'
      sx={(theme) => ({
        ...pageTopStyling,
        top: 'unset',
        ...theme.applyStyles('light', {
          background: `linear-gradient(276deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
        }),
        ...theme.applyStyles('dark', {
          background: theme.palette.container.dark,
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
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, width: '100%' }}>
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
                <DocsSearch renderDialog={false} onOpen={() => setDocsSearchOpen(true)} />
                <Tooltip title='Create a new model or data card'>
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
                </Tooltip>
                {showChristmas && snowToggleButton}
                {currentUser ? (
                  <>
                    <Tooltip title='User settings'>
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
                    </Tooltip>
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
                      {uiConfig.syOps.enabled && (
                        <MenuItem component='a' href={uiConfig.syOps.href} data-test='syOpsLink' role='menuitem'>
                          <ListItemIcon>
                            <SettingsSuggestTwoToneIcon fontSize='small' />
                          </ListItemIcon>
                          <ListItemText>SyOps</ListItemText>
                        </MenuItem>
                      )}
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
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, width: '100%' }}>
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
                {showChristmas && snowToggleButton}
                <DocsSearch renderDialog={false} onOpen={() => setDocsSearchOpen(true)} />
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
                      aria-describedby='user-menu-button-description'
                    >
                      <UserDisplay dn={currentUser.dn} hidePopover />
                      <Box component='span' id='user-menu-button-description' sx={visuallyHidden}>
                        user menu dropdown button
                      </Box>
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
                      {uiConfig.syOps.enabled && (
                        <MenuItem component='a' href={uiConfig.syOps.href} data-test='syOpsLink' role='menuitem'>
                          <ListItemIcon>
                            <SettingsSuggestTwoToneIcon fontSize='small' />
                          </ListItemIcon>
                          <ListItemText>SyOps</ListItemText>
                        </MenuItem>
                      )}
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
          </Box>
        </Stack>
      </Toolbar>
      <DocsSearchDialog open={docsSearchOpen} onClose={() => setDocsSearchOpen(false)} />
      {showChristmas && snowEnabled && <ChristmasLights />}
      {showChristmas && snowEnabled && <Snowfall />}
    </AppBar>
  )
}
